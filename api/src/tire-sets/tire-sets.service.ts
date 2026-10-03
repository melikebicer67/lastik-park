import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { normalizePlate } from '../common/plate.js';
import { foldSearch } from '../common/search.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { tireSetCode } from './tire-set-code.js';
import { CheckInDto, TireSetQueryDto } from './tire-sets.dto.js';

const DETAIL_INCLUDE = {
  customer: true,
  vehicle: true,
  tires: { orderBy: { id: 'asc' } },
  currentLocation: { include: { warehouse: { include: { branch: true } } } },
  stays: {
    orderBy: { checkInAt: 'desc' },
    include: { checkInBy: { select: { name: true } }, checkOutBy: { select: { name: true } } },
  },
} as const;

@Injectable()
export class TireSetsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lastik kabulü: takım + lastikler + konaklama + hareket kaydı tek işlemde oluşturulur
  async checkIn(dto: CheckInDto) {
    const positions = dto.tires.map((t) => t.position).filter((p) => p !== 'OTHER');
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException('Aynı konumda birden fazla lastik girilmiş');
    }

    const id = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) throw new NotFoundException('Müşteri bulunamadı');

      if (dto.vehicleId) {
        const vehicle = await tx.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle || vehicle.customerId !== dto.customerId) {
          throw new BadRequestException('Araç bu müşteriye ait değil');
        }
      }

      // Aynı göze aynı anda iki kabul yapılmasın diye göz satırı kilitlenir
      const locked = await tx.$queryRaw<{ id: number; capacity: number }[]>`
        SELECT id, capacity FROM "StorageLocation"
        WHERE id = ${dto.locationId} AND active = true
        FOR UPDATE`;
      if (locked.length === 0) throw new NotFoundException('Göz bulunamadı');
      const occupied = await tx.tireSet.count({
        where: { currentLocationId: dto.locationId, status: 'IN_STORAGE' },
      });
      if (occupied >= locked[0].capacity) {
        throw new ConflictException('Seçilen göz dolu, başka bir göz seçin');
      }

      const created = await tx.tireSet.create({
        data: {
          code: randomUUID(), // id belli olunca gerçek numara verilir
          customerId: dto.customerId,
          vehicleId: dto.vehicleId ?? null,
          season: dto.season,
          rimType: dto.rimType,
          quantity: dto.tires.length,
          hasHubcaps: dto.hasHubcaps ?? false,
          hasBolts: dto.hasBolts ?? false,
          currentLocationId: dto.locationId,
          note: dto.note?.trim() || null,
          tires: {
            create: dto.tires.map((t) => ({
              position: t.position,
              brand: t.brand.trim(),
              pattern: t.pattern?.trim() || null,
              width: t.width,
              aspectRatio: t.aspectRatio,
              rimDiameter: t.rimDiameter,
              loadIndex: t.loadIndex ?? null,
              speedIndex: t.speedIndex ?? null,
              dot: t.dot ?? null,
              treadDepthMm: t.treadDepthMm ?? null,
              condition: t.condition ?? 'GOOD',
              note: t.note?.trim() || null,
            })),
          },
          stays: {
            create: {
              seasonLabel: dto.seasonLabel?.trim() || null,
              mileageKm: dto.mileageKm ?? null,
              price: dto.price ?? null,
            },
          },
          movements: {
            create: { type: 'CHECK_IN', toLocationId: dto.locationId },
          },
        },
      });

      await tx.tireSet.update({
        where: { id: created.id },
        data: { code: tireSetCode(created.id, created.createdAt) },
      });
      return created.id;
    });

    return this.findOne(id);
  }

  // Lastik Bul: etiket no, plaka, göz, müşteri adı/telefonu veya lastik markasıyla arama
  async list(q: TireSetQueryDto) {
    const where: Prisma.TireSetWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.season) where.season = q.season;

    const text = q.search?.trim();
    if (text) {
      const upper = text.toUpperCase();
      const or: Prisma.TireSetWhereInput[] = [
        { code: { contains: upper } },
        { currentLocation: { code: upper } },
        { tires: { some: { brand: { contains: text, mode: 'insensitive' } } } },
      ];
      const plate = normalizePlate(text);
      if (plate.length >= 2) or.push({ vehicle: { plate: { contains: plate } } });
      const folded = foldSearch(text);
      if (folded.length >= 2) or.push({ customer: { searchKey: { contains: folded } } });
      where.OR = or;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.tireSet.count({ where }),
      this.prisma.tireSet.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { plate: true, brand: true, model: true } },
          currentLocation: { select: { code: true, warehouse: { select: { name: true } } } },
          tires: { select: { brand: true, pattern: true, width: true, aspectRatio: true, rimDiameter: true }, take: 1 },
          stays: { select: { checkInAt: true, checkOutAt: true }, orderBy: { checkInAt: 'desc' }, take: 1 },
        },
        // Depodakiler önce, sonra en yeni giriş
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return {
      total,
      page: q.page,
      pageSize: q.pageSize,
      items: rows.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.status,
        season: r.season,
        rimType: r.rimType,
        quantity: r.quantity,
        location: r.currentLocation?.code ?? null,
        warehouse: r.currentLocation?.warehouse.name ?? null,
        customer: r.customer,
        vehicle: r.vehicle,
        tire: r.tires[0] ?? null,
        checkInAt: r.stays[0]?.checkInAt ?? r.createdAt,
        checkOutAt: r.stays[0]?.checkOutAt ?? null,
      })),
    };
  }

  // QR okutulunca: etiket numarasından takıma
  async findByCode(code: string) {
    const set = await this.prisma.tireSet.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: { id: true, code: true },
    });
    if (!set) throw new NotFoundException(`${code} numaralı etiket bulunamadı`);
    return set;
  }

  async findOne(id: number) {
    const set = await this.prisma.tireSet.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!set) throw new NotFoundException('Lastik takımı bulunamadı');
    return set;
  }
}
