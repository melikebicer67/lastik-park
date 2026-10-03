import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  async warehouses() {
    const rows = await this.prisma.warehouse.findMany({
      where: { active: true },
      include: { branch: { select: { name: true } } },
      orderBy: [{ branchId: 'asc' }, { code: 'asc' }],
    });
    return rows.map((w) => ({ id: w.id, code: w.code, name: w.name, branch: w.branch.name }));
  }

  // Depo haritası: her göz ve içindeki takımlar, üstte doluluk özeti
  async map(warehouseId: number) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: { branch: { select: { name: true } } },
    });
    if (!warehouse) throw new NotFoundException('Depo bulunamadı');

    const rows = await this.prisma.storageLocation.findMany({
      where: { warehouseId, active: true },
      include: {
        tireSets: {
          where: { status: 'IN_STORAGE' },
          select: {
            id: true,
            code: true,
            season: true,
            customer: { select: { name: true } },
            vehicle: { select: { plate: true } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const capacity = rows.reduce((n, l) => n + l.capacity, 0);
    const occupied = rows.reduce((n, l) => n + l.tireSets.length, 0);
    return {
      warehouse: { id: warehouse.id, name: warehouse.name, branch: warehouse.branch.name },
      summary: { locations: rows.length, capacity, occupied, free: capacity - occupied },
      locations: rows.map((l) => ({
        id: l.id,
        code: l.code,
        aisle: l.aisle,
        rack: l.rack,
        level: l.level,
        capacity: l.capacity,
        sets: l.tireSets.map((t) => ({
          id: t.id,
          code: t.code,
          season: t.season,
          customer: t.customer.name,
          plate: t.vehicle?.plate ?? null,
        })),
      })),
    };
  }

  // Gözler ve doluluk; onlyAvailable ile sadece yeri olanlar
  async locations(warehouseId: number, onlyAvailable: boolean) {
    const rows = await this.prisma.storageLocation.findMany({
      where: { warehouseId, active: true },
      include: { _count: { select: { tireSets: { where: { status: 'IN_STORAGE' } } } } },
      orderBy: { code: 'asc' },
    });
    const items = rows.map((l) => ({
      id: l.id,
      code: l.code,
      aisle: l.aisle,
      rack: l.rack,
      level: l.level,
      capacity: l.capacity,
      occupied: l._count.tireSets,
    }));
    return onlyAvailable ? items.filter((l) => l.occupied < l.capacity) : items;
  }
}
