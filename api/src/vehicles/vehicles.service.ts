import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { formatPlate, isValidPlate, normalizePlate } from '../common/plate.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVehicleDto } from './vehicles.dto.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    const plate = normalizePlate(dto.plate);
    if (!isValidPlate(plate)) {
      throw new BadRequestException(`Geçersiz plaka: ${dto.plate}`);
    }
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    const existing = await this.prisma.vehicle.findUnique({
      where: { plate },
      include: { customer: { select: { name: true } } },
    });
    if (existing) {
      if (existing.customerId === dto.customerId) return existing;
      throw new ConflictException(
        `${formatPlate(plate)} plakası başka bir müşteriye kayıtlı: ${existing.customer.name}`,
      );
    }

    return this.prisma.vehicle.create({
      data: {
        customerId: dto.customerId,
        plate,
        brand: dto.brand?.trim() || null,
        model: dto.model?.trim() || null,
        year: dto.year ?? null,
      },
    });
  }
}
