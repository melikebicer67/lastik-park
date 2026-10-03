// Demo verisi: müşteriler (sahte LOGO'dan), araçlar, lastik takımları, konaklamalar ve hareketler.
// DİKKAT: müşteri/araç/lastik tablolarını boşaltıp baştan doldurur. Depo ve LOGO ayarlarına dokunmaz.
// Çalıştırma: npm run db:demo
import 'dotenv/config';
import { fakerTR as faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import sql from 'mssql';
import { customerSearchKey } from '../src/common/search.js';
import type { RimType, Season, TireCondition, TirePosition } from '../src/generated/prisma/enums.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { Employee, Vehicle } from '../src/generated/prisma/client.js';
import { tireSetCode } from '../src/tire-sets/tire-set-code.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo verisi üretim ortamında çalıştırılamaz');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

faker.seed(2026);
const pick = <T>(arr: readonly T[]): T => faker.helpers.arrayElement(arr);
const NOW = new Date();

// Ereğli bayisi: çoğunluk Zonguldak (67), çevre iller ve büyükşehirler
const PLATE_CITIES = [
  ...Array(12).fill('67'),
  ...Array(2).fill('74'),
  ...Array(2).fill('78'),
  ...Array(2).fill('81'),
  '34', '34', '06', '54', '14',
];
const PLATE_LETTERS = 'ABCDEFGHJKLMNPRSTUVYZ';

function plate(): string {
  const city = pick(PLATE_CITIES);
  const letterCount = faker.number.int({ min: 1, max: 3 });
  const letters = Array.from({ length: letterCount }, () => pick([...PLATE_LETTERS])).join('');
  const digits = letterCount === 1 ? 4 : letterCount === 2 ? faker.helpers.arrayElement([3, 4]) : faker.helpers.arrayElement([2, 3]);
  return `${city}${letters}${faker.string.numeric({ length: digits, allowLeadingZeros: false })}`;
}

// Araç → olası lastik ebatları
const CARS: { brand: string; model: string; sizes: string[] }[] = [
  { brand: 'Fiat', model: 'Egea', sizes: ['195/65 R15 91H', '205/55 R16 91V'] },
  { brand: 'Renault', model: 'Clio', sizes: ['185/65 R15 88H', '195/55 R16 87H'] },
  { brand: 'Renault', model: 'Megane', sizes: ['205/55 R16 91V', '205/50 R17 93V'] },
  { brand: 'Renault', model: 'Taliant', sizes: ['185/65 R15 88H'] },
  { brand: 'Toyota', model: 'Corolla', sizes: ['205/55 R16 91V', '225/45 R17 94W'] },
  { brand: 'Toyota', model: 'C-HR', sizes: ['215/60 R17 96H', '225/50 R18 95V'] },
  { brand: 'Volkswagen', model: 'Passat', sizes: ['215/55 R17 94V', '235/45 R18 98Y'] },
  { brand: 'Volkswagen', model: 'Golf', sizes: ['205/55 R16 91V', '225/45 R17 94W'] },
  { brand: 'Volkswagen', model: 'Polo', sizes: ['185/65 R15 88H', '195/55 R16 87H'] },
  { brand: 'Hyundai', model: 'i20', sizes: ['185/65 R15 88H', '195/55 R16 87H'] },
  { brand: 'Hyundai', model: 'Tucson', sizes: ['225/60 R17 99H', '235/55 R18 100V'] },
  { brand: 'Ford', model: 'Focus', sizes: ['205/55 R16 91V', '215/50 R17 95W'] },
  { brand: 'Ford', model: 'Kuga', sizes: ['225/60 R18 100H', '235/50 R19 99V'] },
  { brand: 'Ford', model: 'Transit Courier', sizes: ['195/65 R15 91H'] },
  { brand: 'Dacia', model: 'Duster', sizes: ['215/65 R16 98H', '215/60 R17 96H'] },
  { brand: 'Dacia', model: 'Sandero', sizes: ['185/65 R15 88H'] },
  { brand: 'Peugeot', model: '3008', sizes: ['225/55 R18 98V', '205/55 R19 97V'] },
  { brand: 'Peugeot', model: '208', sizes: ['195/55 R16 87H', '205/45 R17 88V'] },
  { brand: 'Opel', model: 'Astra', sizes: ['205/55 R16 91V', '225/45 R17 94W'] },
  { brand: 'Opel', model: 'Corsa', sizes: ['185/65 R15 88H', '195/55 R16 87H'] },
  { brand: 'Honda', model: 'Civic', sizes: ['215/55 R16 93V', '235/40 R18 95Y'] },
  { brand: 'BMW', model: '320i', sizes: ['225/45 R18 95Y', '225/50 R17 94W'] },
  { brand: 'Mercedes-Benz', model: 'C 200', sizes: ['225/50 R17 94W', '225/45 R18 95Y'] },
  { brand: 'Skoda', model: 'Octavia', sizes: ['205/55 R16 91V', '225/45 R17 94W'] },
  { brand: 'Citroën', model: 'C-Elysée', sizes: ['185/65 R15 88H'] },
];

const PATTERNS: Record<Season, { brand: string; pattern: string }[]> = {
  SUMMER: [
    { brand: 'Michelin', pattern: 'Primacy 4+' },
    { brand: 'Continental', pattern: 'PremiumContact 7' },
    { brand: 'Bridgestone', pattern: 'Turanza 6' },
    { brand: 'Lassa', pattern: 'Driveways' },
    { brand: 'Lassa', pattern: 'Revola' },
    { brand: 'Pirelli', pattern: 'Cinturato P7' },
    { brand: 'Goodyear', pattern: 'EfficientGrip Performance 2' },
    { brand: 'Petlas', pattern: 'Imperium PT515' },
    { brand: 'Hankook', pattern: 'Ventus Prime 4' },
  ],
  WINTER: [
    { brand: 'Michelin', pattern: 'Alpin 6' },
    { brand: 'Continental', pattern: 'WinterContact TS 870' },
    { brand: 'Bridgestone', pattern: 'Blizzak LM005' },
    { brand: 'Lassa', pattern: 'Snoways 4' },
    { brand: 'Pirelli', pattern: 'Winter Sottozero 3' },
    { brand: 'Goodyear', pattern: 'UltraGrip Performance 3' },
    { brand: 'Petlas', pattern: 'SnowMaster 2' },
    { brand: 'Hankook', pattern: 'Winter i*cept RS3' },
  ],
  ALL_SEASON: [
    { brand: 'Michelin', pattern: 'CrossClimate 2' },
    { brand: 'Continental', pattern: 'AllSeasonContact 2' },
    { brand: 'Lassa', pattern: 'Multiways 2' },
    { brand: 'Goodyear', pattern: 'Vector 4Seasons Gen-3' },
  ],
};

const PRICES: Record<RimType, number> = { NONE: 1250, STEEL: 1500, ALLOY: 1750 };
const POSITIONS: TirePosition[] = ['FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT', 'REAR_RIGHT'];

function parseSize(size: string) {
  const m = /^(\d+)\/(\d+) R(\d+) (\d+)([A-Z])$/.exec(size)!;
  return { width: +m[1], aspectRatio: +m[2], rimDiameter: +m[3], loadIndex: +m[4], speedIndex: m[5] };
}

function tires(season: Season, size: string) {
  const { brand, pattern } = pick(PATTERNS[season]);
  const dotYear = faker.number.int({ min: 19, max: 25 });
  const dotWeek = faker.number.int({ min: 1, max: 52 });
  const base = faker.number.float({ min: 2.4, max: 7.8, fractionDigits: 1 });
  return POSITIONS.map((position) => {
    const tread = Math.max(1.6, Math.round((base + faker.number.float({ min: -0.6, max: 0.6 })) * 10) / 10);
    const condition: TireCondition = faker.datatype.boolean(0.03) ? 'DAMAGED' : tread < 3 ? 'WORN' : 'GOOD';
    return {
      position,
      brand,
      pattern,
      ...parseSize(size),
      dot: `${String(dotWeek).padStart(2, '0')}${dotYear}`,
      treadDepthMm: tread,
      condition,
      note: condition === 'DAMAGED' ? pick(['Yanakta kesik', 'Sırtta çivi izi', 'Yanak şişkinliği']) : null,
    };
  });
}

function dateBetween(from: string | Date, to: string | Date) {
  const d = faker.date.between({ from, to });
  d.setHours(faker.number.int({ min: 8, max: 18 }), faker.number.int({ min: 0, max: 59 }), 0, 0);
  return d;
}

async function loadLogo() {
  const pool = await new sql.ConnectionPool({
    server: process.env.LOGO_SERVER ?? 'localhost',
    port: Number(process.env.LOGO_PORT ?? 1433),
    database: process.env.LOGO_DATABASE,
    user: process.env.LOGO_USER,
    password: process.env.LOGO_PASSWORD,
    options: { encrypt: false, trustServerCertificate: true },
  }).connect();
  const firm = (process.env.LOGO_FIRM_NO ?? '001').padStart(3, '0');
  const customers = await pool.request().query(`
    SELECT LOGICALREF, CODE, DEFINITION_, ISPERSCOMP, TCKNO, TAXNR, TAXOFFICE, TELNRS1, EMAILADDR, CITY
    FROM LG_${firm}_CLCARD WHERE ACTIVE = 0`);
  const salesmen = await pool.request().query(`
    SELECT LOGICALREF, CODE, DEFINITION_, TELNUMBER FROM LG_SLSMAN WHERE FIRMNR = ${Number(firm)} AND ACTIVE = 0`);
  await pool.close();
  return { customers: customers.recordset, salesmen: salesmen.recordset };
}

async function main() {
  const t = (v: unknown) => (typeof v === 'string' ? v.trim() : '') || null;
  const logo = await loadLogo();
  const locations = await prisma.storageLocation.findMany({ where: { active: true }, orderBy: { code: 'asc' } });
  if (locations.length === 0) throw new Error('Önce depo tanımlanmalı: npm run db:seed');

  await prisma.$executeRawUnsafe(`TRUNCATE "TirePhoto", "TireMovement", "Stay", "Tire", "Appointment", "TireSet",
    "Vehicle", "Customer", "User", "Employee" RESTART IDENTITY CASCADE`);

  // Personel: LOGO satış elemanlarından
  const employees: Employee[] = [];
  for (const s of logo.salesmen) {
    employees.push(
      await prisma.employee.create({
        data: { source: 'LOGO_SALESMAN', logoRef: s.LOGICALREF, code: t(s.CODE), name: t(s.DEFINITION_)!, phone: t(s.TELNUMBER) },
      }),
    );
  }

  // Müşteriler: LOGO carilerinden rastgele 110 tanesi
  const picked = faker.helpers.arrayElements(logo.customers, 110);
  const customers = [];
  for (const c of picked) {
    const data = {
      logoRef: c.LOGICALREF as number,
      logoCode: t(c.CODE),
      name: t(c.DEFINITION_)!,
      isPerson: c.ISPERSCOMP === 1,
      tckn: t(c.TCKNO),
      taxNr: t(c.TAXNR),
      taxOffice: t(c.TAXOFFICE),
      phone: t(c.TELNRS1),
      email: t(c.EMAILADDR),
      city: t(c.CITY),
      syncedAt: NOW,
    };
    customers.push(await prisma.customer.create({ data: { ...data, searchKey: customerSearchKey(data) } }));
  }

  // Araçlar: şahıslara 1, firmalara 1-4 araç
  const vehicles: { car: (typeof CARS)[number]; vehicle: Vehicle }[] = [];
  const usedPlates = new Set<string>();
  for (const c of customers) {
    const count = c.isPerson ? (faker.datatype.boolean(0.1) ? 2 : 1) : faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < count; i++) {
      let p = plate();
      while (usedPlates.has(p)) p = plate();
      usedPlates.add(p);
      const car = pick(CARS);
      vehicles.push({
        car,
        vehicle: await prisma.vehicle.create({
          data: {
            customerId: c.id,
            plate: p,
            brand: car.brand,
            model: car.model,
            year: faker.number.int({ min: 2012, max: 2026 }),
          },
        }),
      });
    }
  }

  const freeLocations = faker.helpers.shuffle([...locations]);
  let created = 0;

  async function createSet(opts: {
    v: (typeof vehicles)[number];
    season: Season;
    checkInAt: Date;
    checkOutAt?: Date;
    seasonLabel: string;
  }) {
    const { v, season, checkInAt, checkOutAt } = opts;
    const inStorage = !checkOutAt;
    const location = inStorage ? freeLocations.pop() : undefined;
    if (inStorage && !location) return;
    const rimType: RimType = faker.helpers.weightedArrayElement([
      { value: 'NONE', weight: 6 },
      { value: 'STEEL', weight: 2 },
      { value: 'ALLOY', weight: 3 },
    ]);
    const size = pick(v.car.sizes);
    const checkInBy = pick(employees);
    const checkOutBy = pick(employees);
    // Sonradan raf değişikliği yapılmış birkaç kayıt
    const relocated = inStorage && faker.datatype.boolean(0.12) ? freeLocations.pop() : undefined;
    const finalLocation = relocated ?? location;
    if (relocated && location) freeLocations.unshift(location);

    // Teslim edilmişlerde de bir zamanlar durduğu göz hareket kaydında görünsün
    const pastLocation = location ?? pick(locations);

    const set = await prisma.tireSet.create({
      data: {
        code: `TMP-${created}`,
        customerId: v.vehicle.customerId,
        vehicleId: v.vehicle.id,
        season,
        status: inStorage ? 'IN_STORAGE' : 'DELIVERED',
        rimType,
        quantity: 4,
        hasHubcaps: rimType === 'STEEL' && faker.datatype.boolean(0.5),
        hasBolts: rimType !== 'NONE' && faker.datatype.boolean(0.7),
        currentLocationId: inStorage ? finalLocation!.id : null,
        note: faker.datatype.boolean(0.08) ? pick(['Müşteri balans istedi', 'Sibop değişecek', 'Jant kapağı eksik', 'Teslimde rot ayarı']) : null,
        createdAt: checkInAt,
        tires: { create: tires(season, size) },
        stays: {
          create: {
            seasonLabel: opts.seasonLabel,
            checkInAt,
            checkInById: checkInBy.id,
            checkOutAt: checkOutAt ?? null,
            checkOutById: checkOutAt ? checkOutBy.id : null,
            mileageKm: faker.number.int({ min: 8, max: 240 }) * 1000,
            price: PRICES[rimType],
            paid: checkOutAt ? true : faker.datatype.boolean(0.75),
          },
        },
        movements: {
          create: [
            { type: 'CHECK_IN', toLocationId: pastLocation.id, employeeId: checkInBy.id, at: checkInAt },
            ...(relocated
              ? [{ type: 'RELOCATE' as const, fromLocationId: location!.id, toLocationId: relocated.id, employeeId: pick(employees).id, at: dateBetween(checkInAt, NOW), note: 'Raf düzenlemesi' }]
              : []),
            ...(checkOutAt
              ? [{ type: 'CHECK_OUT' as const, fromLocationId: pastLocation.id, employeeId: checkOutBy.id, at: checkOutAt }]
              : []),
          ],
        },
      },
    });
    await prisma.tireSet.update({ where: { id: set.id }, data: { code: tireSetCode(set.id, checkInAt) } });
    created++;
  }

  const shuffled = faker.helpers.shuffle([...vehicles]);
  const year = NOW.getFullYear();

  // Geçmiş: geçen kış depolanan yazlıklar (Kasım → Nisan) ve bu yaz depolanan kışlıklar (Nisan → Ekim)
  for (const v of shuffled.slice(0, 35)) {
    await createSet({
      v,
      season: 'SUMMER',
      checkInAt: dateBetween(`${year - 1}-11-01`, `${year - 1}-12-15`),
      checkOutAt: dateBetween(`${year}-04-01`, `${year}-04-30`),
      seasonLabel: `${year - 1}-${year} Kış`,
    });
  }
  for (const v of shuffled.slice(0, 25)) {
    await createSet({
      v,
      season: 'WINTER',
      checkInAt: dateBetween(`${year}-04-01`, `${year}-04-30`),
      checkOutAt: dateBetween(`${year}-09-25`, NOW),
      seasonLabel: `${year} Yaz`,
    });
  }

  // Depoda olanlar: kışa geçişte bırakılan yazlıklar (son 3 hafta) ...
  for (const v of shuffled.slice(25, 95)) {
    await createSet({
      v,
      season: faker.datatype.boolean(0.9) ? 'SUMMER' : 'ALL_SEASON',
      checkInAt: dateBetween(new Date(NOW.getTime() - 21 * 864e5), NOW),
      seasonLabel: `${year}-${year + 1} Kış`,
    });
  }
  // ... ve henüz teslim alınmamış kışlıklar (Nisan'dan beri bekliyor)
  for (const v of shuffled.slice(95, 112)) {
    await createSet({
      v,
      season: 'WINTER',
      checkInAt: dateBetween(`${year}-04-01`, `${year}-05-10`),
      seasonLabel: `${year} Yaz`,
    });
  }

  const inStorage = await prisma.tireSet.count({ where: { status: 'IN_STORAGE' } });
  console.log(
    `✓ ${employees.length} personel, ${customers.length} müşteri, ${vehicles.length} araç, ` +
      `${created} lastik takımı (${inStorage} depoda, ${created - inStorage} teslim edilmiş). ` +
      `Doluluk: ${inStorage}/${locations.length} göz`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
