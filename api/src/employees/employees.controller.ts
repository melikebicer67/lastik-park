import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly prisma: PrismaService) {}

  // Kabul ve teslim ekranlarındaki "işlemi yapan" seçimi için
  @Get()
  list() {
    return this.prisma.employee.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
