import { Injectable, NotFoundException } from '@nestjs/common';
import { foldSearch } from '../common/search.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildPurchaseReport } from './purchase-report.js';
import { CreatePurchaseDto, DateRangeDto, PurchaseQueryDto, SupplierDto } from './purchasing.dto.js';

// Tarih aralığı verilmezse son 12 ay (bu ay dahil)
function resolveRange(q: DateRangeDto) {
  const to = q.to ? new Date(q.to) : new Date();
  const from = q.from ? new Date(q.from) : new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth() + 1, 1));
  return { from, to };
}

const lineTotal = (l: { quantity: number; unitPrice: unknown }) => l.quantity * Number(l.unitPrice);

@Injectable()
export class PurchasingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tedarikçiler ──

  async suppliers() {
    const rows = await this.prisma.supplier.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        purchases: {
          select: { purchaseDate: true, lines: { select: { quantity: true, unitPrice: true } } },
        },
      },
    });
    return rows.map(({ purchases, ...s }) => ({
      ...s,
      purchaseCount: purchases.length,
      quantity: purchases.reduce((n, p) => n + p.lines.reduce((m, l) => m + l.quantity, 0), 0),
      amount: Math.round(purchases.reduce((n, p) => n + p.lines.reduce((m, l) => m + lineTotal(l), 0), 0) * 100) / 100,
      lastPurchaseDate: purchases.reduce<Date | null>((d, p) => (!d || p.purchaseDate > d ? p.purchaseDate : d), null),
    }));
  }

  createSupplier(dto: SupplierDto) {
    return this.prisma.supplier.create({ data: this.supplierData(dto) });
  }

  async updateSupplier(id: number, dto: SupplierDto) {
    await this.ensureSupplier(id);
    return this.prisma.supplier.update({ where: { id }, data: this.supplierData(dto) });
  }

  private supplierData(dto: SupplierDto) {
    const t = (v?: string) => v?.trim() || null;
    return {
      name: dto.name.trim(),
      type: dto.type,
      taxNr: t(dto.taxNr),
      phone: t(dto.phone),
      contactName: t(dto.contactName),
      city: t(dto.city),
      note: t(dto.note),
      searchKey: foldSearch(`${dto.name}${dto.city ?? ''}${dto.contactName ?? ''}`),
    };
  }

  private async ensureSupplier(id: number) {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Tedarikçi bulunamadı');
    return s;
  }

  // ── Alımlar ──

  async list(q: PurchaseQueryDto) {
    const { from, to } = resolveRange(q);
    const where: Prisma.PurchaseWhereInput = { purchaseDate: { gte: from, lte: to } };
    if (q.supplierId) where.supplierId = q.supplierId;
    if (q.type) where.supplier = { type: q.type };
    const text = q.search?.trim();
    if (text) {
      where.OR = [
        { documentNo: { contains: text, mode: 'insensitive' } },
        { supplier: { searchKey: { contains: foldSearch(text) } } },
        { lines: { some: { brand: { contains: text, mode: 'insensitive' } } } },
        { lines: { some: { pattern: { contains: text, mode: 'insensitive' } } } },
      ];
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, type: true } },
          lines: { select: { brand: true, quantity: true, unitPrice: true, vatRate: true } },
        },
        orderBy: [{ purchaseDate: 'desc' }, { id: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return {
      total,
      page: q.page,
      pageSize: q.pageSize,
      items: rows.map((p) => {
        const net = p.lines.reduce((n, l) => n + lineTotal(l), 0);
        const vat = p.lines.reduce((n, l) => n + lineTotal(l) * (l.vatRate / 100), 0);
        return {
          id: p.id,
          purchaseDate: p.purchaseDate,
          documentNo: p.documentNo,
          supplier: p.supplier,
          brands: [...new Set(p.lines.map((l) => l.brand))],
          quantity: p.lines.reduce((n, l) => n + l.quantity, 0),
          amount: Math.round(net * 100) / 100,
          amountWithVat: Math.round((net + vat) * 100) / 100,
        };
      }),
    };
  }

  async findOne(id: number) {
    const p = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { name: true } },
        lines: { orderBy: { id: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException('Alım bulunamadı');
    return p;
  }

  async create(dto: CreatePurchaseDto) {
    await this.ensureSupplier(dto.supplierId);
    const p = await this.prisma.purchase.create({
      data: {
        supplierId: dto.supplierId,
        purchaseDate: new Date(dto.purchaseDate),
        documentNo: dto.documentNo?.trim() || null,
        note: dto.note?.trim() || null,
        createdById: dto.createdById ?? null,
        lines: {
          create: dto.lines.map((l) => ({
            brand: l.brand.trim(),
            pattern: l.pattern?.trim() || null,
            season: l.season,
            width: l.width,
            aspectRatio: l.aspectRatio,
            rimDiameter: l.rimDiameter,
            loadIndex: l.loadIndex ?? null,
            speedIndex: l.speedIndex ?? null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate ?? 20,
          })),
        },
      },
    });
    return this.findOne(p.id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.purchase.delete({ where: { id } });
    return { ok: true };
  }

  async report(q: DateRangeDto) {
    const { from, to } = resolveRange(q);
    const lines = await this.prisma.purchaseLine.findMany({
      where: { purchase: { purchaseDate: { gte: from, lte: to } } },
      include: { purchase: { select: { id: true, purchaseDate: true, supplier: { select: { id: true, name: true, type: true } } } } },
    });
    return buildPurchaseReport(
      lines.map((l) => ({
        date: l.purchase.purchaseDate,
        purchaseId: l.purchase.id,
        supplierId: l.purchase.supplier.id,
        supplierName: l.purchase.supplier.name,
        supplierType: l.purchase.supplier.type,
        brand: l.brand,
        pattern: l.pattern,
        width: l.width,
        aspectRatio: l.aspectRatio,
        rimDiameter: Number(l.rimDiameter),
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
        vatRate: l.vatRate,
      })),
      from,
      to,
    );
  }
}
