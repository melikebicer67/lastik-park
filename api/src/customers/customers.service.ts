import { Injectable, NotFoundException } from '@nestjs/common';
import { customerSearchKey } from '../common/search.js';
import { LogoRepository } from '../logo/logo.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logo: LogoRepository,
  ) {}

  // LOGO'daki cariyi uygulamaya alır (varsa günceller). Kabul ekranında müşteri seçilince çağrılır.
  async importFromLogo(logoRef: number) {
    const c = await this.logo.findCustomer(logoRef);
    const data = {
      logoCode: c.code,
      name: c.name,
      isPerson: c.isPerson,
      tckn: c.tckn || null,
      taxNr: c.taxNr || null,
      taxOffice: c.taxOffice || null,
      phone: c.phone || null,
      email: c.email || null,
      city: c.city || null,
      active: c.active,
      syncedAt: new Date(),
      searchKey: customerSearchKey({ ...c, logoCode: c.code }),
    };
    const customer = await this.prisma.customer.upsert({
      where: { logoRef },
      create: { logoRef, ...data },
      update: data,
    });
    return this.findOne(customer.id);
  }

  // Müşteri geçmişi: tüm konaklamalar (kabul/teslim tarihi, süre, göz, ücret, personel) ve özet
  async history(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { vehicles: { orderBy: { plate: 'asc' } } },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    const stays = await this.prisma.stay.findMany({
      where: { tireSet: { customerId: id } },
      orderBy: { checkInAt: 'desc' },
      include: {
        checkInBy: { select: { name: true } },
        checkOutBy: { select: { name: true } },
        tireSet: {
          select: {
            id: true,
            code: true,
            season: true,
            status: true,
            rimType: true,
            quantity: true,
            vehicle: { select: { id: true, plate: true } },
            currentLocation: { select: { code: true } },
            tires: {
              select: { brand: true, pattern: true, width: true, aspectRatio: true, rimDiameter: true, treadDepthMm: true },
            },
            movements: {
              orderBy: { at: 'desc' },
              select: { type: true, fromLocation: { select: { code: true } }, toLocation: { select: { code: true } } },
            },
          },
        },
      },
    });

    const now = Date.now();
    const DAY = 864e5;
    const items = stays.map((st) => {
      const t = st.tireSet;
      const end = st.checkOutAt?.getTime() ?? now;
      const depths = t.tires.map((x) => Number(x.treadDepthMm)).filter((d) => d > 0);
      return {
        stayId: st.id,
        tireSetId: t.id,
        code: t.code,
        season: t.season,
        status: t.status,
        rimType: t.rimType,
        quantity: t.quantity,
        plate: t.vehicle?.plate ?? null,
        tire: t.tires[0] ?? null,
        minTreadDepthMm: depths.length ? Math.min(...depths) : null,
        // Depodaysa bugünkü göz; teslim edildiyse çıktığı göz (yoksa son yerleştirildiği göz)
        location:
          t.currentLocation?.code ??
          t.movements.find((m) => m.type === 'CHECK_OUT')?.fromLocation?.code ??
          t.movements.find((m) => m.toLocation)?.toLocation?.code ??
          null,
        seasonLabel: st.seasonLabel,
        checkInAt: st.checkInAt,
        checkOutAt: st.checkOutAt,
        days: Math.max(0, Math.floor((end - st.checkInAt.getTime()) / DAY)),
        mileageKm: st.mileageKm,
        price: st.price === null ? null : Number(st.price),
        paid: st.paid,
        checkInBy: st.checkInBy?.name ?? null,
        checkOutBy: st.checkOutBy?.name ?? null,
        note: st.note,
      };
    });

    const closed = items.filter((i) => i.checkOutAt);
    const sum = (xs: (number | null)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);
    return {
      customer: {
        id: customer.id,
        logoCode: customer.logoCode,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        createdAt: customer.createdAt,
      },
      vehicles: customer.vehicles.map((v) => ({ id: v.id, plate: v.plate, brand: v.brand, model: v.model })),
      summary: {
        stays: items.length,
        inStorage: items.filter((i) => !i.checkOutAt).length,
        firstCheckInAt: items.at(-1)?.checkInAt ?? null,
        avgDays: closed.length ? Math.round(sum(closed.map((i) => i.days)) / closed.length) : null,
        totalBilled: sum(items.map((i) => i.price)),
        unpaid: sum(items.filter((i) => !i.paid).map((i) => i.price)),
      },
      items,
    };
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { vehicles: { orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return customer;
  }
}
