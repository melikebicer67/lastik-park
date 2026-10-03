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

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { vehicles: { orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return customer;
  }
}
