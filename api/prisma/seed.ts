// Geliştirme için örnek depo (Tunç Rulman / Ereğli bayisi): 1 şube, 1 depo, A-C koridor × 10 raf × 4 kat = 120 göz
// Tekrar çalıştırılabilir; mevcut kayıtlar korunur.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const branch = await prisma.branch.upsert({
    where: { code: 'MRK' },
    create: { code: 'MRK', name: 'Ereğli' },
    update: {},
  });
  const warehouse = await prisma.warehouse.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'ANA' } },
    create: { branchId: branch.id, code: 'ANA', name: 'Ana Depo' },
    update: {},
  });

  const locations = [];
  for (const aisle of ['A', 'B', 'C']) {
    for (let rack = 1; rack <= 10; rack++) {
      for (let level = 1; level <= 4; level++) {
        const r = String(rack).padStart(2, '0');
        locations.push({
          warehouseId: warehouse.id,
          code: `${aisle}-${r}-${level}`,
          aisle,
          rack: r,
          level: String(level),
        });
      }
    }
  }
  const { count } = await prisma.storageLocation.createMany({ data: locations, skipDuplicates: true });
  console.log(`✓ ${branch.name} / ${warehouse.name}: ${count} yeni göz (${locations.length} toplam)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
