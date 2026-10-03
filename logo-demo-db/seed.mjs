// LOGO Tiger/Go tablo yapısını taklit eden sahte veritabanını oluşturur ve doldurur.
// Sadece uygulamanın okuduğu kolonlar var; kolon adları gerçek LOGO ile aynıdır.
// Tekrar çalıştırılabilir: tablolar silinip baştan oluşturulur.
import sql from 'mssql';
import { fakerTR as faker } from '@faker-js/faker';

const env = process.env;
const DB = env.LOGO_DB ?? 'LOGODEMO';
const FIRM = (env.LOGO_FIRM_NO ?? '001').padStart(3, '0');
const CUSTOMER_COUNT = Number(env.CUSTOMER_COUNT ?? 300);

if (!/^[A-Za-z0-9_]+$/.test(DB) || !/^\d{3}$/.test(FIRM)) {
  throw new Error('LOGO_DB veya LOGO_FIRM_NO geçersiz');
}

const baseConfig = {
  server: env.MSSQL_HOST ?? 'localhost',
  port: Number(env.MSSQL_PORT ?? 1433),
  user: env.MSSQL_USER ?? 'sa',
  password: env.MSSQL_PASSWORD ?? 'Logo.Demo.2026',
  options: { encrypt: false, trustServerCertificate: true },
};

faker.seed(42);

// Geçerli kontrol hanelerine sahip TC kimlik numarası
function tckn() {
  const d = [faker.number.int({ min: 1, max: 9 })];
  for (let i = 0; i < 8; i++) d.push(faker.number.int(9));
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d.push((((odd * 7 - even) % 10) + 10) % 10);
  d.push(d.reduce((a, b) => a + b, 0) % 10);
  return d.join('');
}

function phone() {
  const prefix = faker.helpers.arrayElement(['532', '533', '535', '542', '543', '505', '506', '553', '555']);
  return `0${prefix} ${faker.string.numeric(3)} ${faker.string.numeric(2)} ${faker.string.numeric(2)}`;
}

function ascii(s) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

const TAX_OFFICES = ['Kadıköy', 'Beşiktaş', 'Çankaya', 'Konak', 'Nilüfer', 'Osmangazi', 'Seyhan', 'Muratpaşa', 'Selçuklu', 'Kartal'];
const SECTORS = ['Otomotiv', 'Lojistik', 'Nakliyat', 'Turizm', 'İnşaat', 'Gıda', 'Filo Kiralama', 'Taşımacılık'];
const SUFFIXES = ['Ltd. Şti.', 'A.Ş.', 'San. ve Tic. Ltd. Şti.'];
const TOWNS = ['Merkez', 'Kadıköy', 'Ümraniye', 'Çankaya', 'Keçiören', 'Bornova', 'Karşıyaka', 'Nilüfer', 'Osmangazi', 'Muratpaşa', 'Seyhan', 'Tepebaşı', 'Pamukkale', 'Atakum'];
const POSITIONS = ['Lastik Ustası', 'Depo Sorumlusu', 'Danışman', 'Şube Müdürü', 'Muhasebe'];

function customer(i) {
  const isPerson = faker.datatype.boolean(0.7);
  const city = faker.location.city();
  const created = faker.date.past({ years: 5 });
  const base = {
    LOGICALREF: i,
    ACTIVE: faker.datatype.boolean(0.92) ? 0 : 1, // LOGO'da 0 = aktif, 1 = pasif
    CARDTYPE: faker.helpers.weightedArrayElement([{ value: 1, weight: 9 }, { value: 3, weight: 1 }]),
    CODE: `120.01.${String(i).padStart(4, '0')}`,
    SPECODE: faker.helpers.arrayElement(['', '', 'FILO', 'BIREYSEL', 'VIP']),
    ADDR1: faker.location.streetAddress(),
    ADDR2: '',
    CITY: city,
    TOWN: faker.helpers.arrayElement(TOWNS),
    COUNTRY: 'TÜRKİYE',
    TELNRS1: phone(),
    TELNRS2: faker.datatype.boolean(0.3) ? phone() : '',
    CAPIBLOCK_CREADEDDATE: created, // LOGO'daki yazım hatası birebir korunmuştur
    CAPIBLOCK_MODIFIEDDATE: faker.date.between({ from: created, to: new Date() }),
  };
  if (isPerson) {
    const name = faker.person.firstName();
    const surname = faker.person.lastName();
    return {
      ...base,
      DEFINITION_: `${name} ${surname}`.toLocaleUpperCase('tr'),
      ISPERSCOMP: 1,
      NAME: name,
      SURNAME: surname,
      TCKNO: tckn(),
      TAXNR: '',
      TAXOFFICE: '',
      EMAILADDR: faker.datatype.boolean(0.6) ? `${ascii(name)}.${ascii(surname)}@example.com` : '',
    };
  }
  const company = `${faker.person.lastName()} ${faker.helpers.arrayElement(SECTORS)} ${faker.helpers.arrayElement(SUFFIXES)}`;
  return {
    ...base,
    DEFINITION_: company.toLocaleUpperCase('tr'),
    ISPERSCOMP: 0,
    NAME: '',
    SURNAME: '',
    TCKNO: '',
    TAXNR: faker.string.numeric({ length: 10, allowLeadingZeros: false }),
    TAXOFFICE: faker.helpers.arrayElement(TAX_OFFICES),
    EMAILADDR: `info@${ascii(company.split(' ')[0])}.example.com`,
  };
}

const CLCARD = `LG_${FIRM}_CLCARD`;
const PERSON = `LH_${FIRM}_PERSON`;

const schema = `
IF OBJECT_ID('${CLCARD}') IS NOT NULL DROP TABLE ${CLCARD};
CREATE TABLE ${CLCARD} (
  LOGICALREF int NOT NULL PRIMARY KEY,
  ACTIVE smallint NOT NULL DEFAULT 0,
  CARDTYPE smallint NOT NULL DEFAULT 1,
  CODE varchar(101) NOT NULL,
  DEFINITION_ varchar(201) NOT NULL,
  SPECODE varchar(11) NULL,
  ADDR1 varchar(201) NULL,
  ADDR2 varchar(201) NULL,
  CITY varchar(51) NULL,
  TOWN varchar(51) NULL,
  COUNTRY varchar(51) NULL,
  TELNRS1 varchar(51) NULL,
  TELNRS2 varchar(51) NULL,
  TAXNR varchar(16) NULL,
  TAXOFFICE varchar(31) NULL,
  EMAILADDR varchar(251) NULL,
  ISPERSCOMP smallint NOT NULL DEFAULT 0,
  TCKNO varchar(16) NULL,
  NAME varchar(51) NULL,
  SURNAME varchar(51) NULL,
  CAPIBLOCK_CREADEDDATE datetime NULL,
  CAPIBLOCK_MODIFIEDDATE datetime NULL
);
CREATE INDEX I_${CLCARD}_CODE ON ${CLCARD}(CODE);

-- LG_SLSMAN firma numarası içermez, tüm firmalar için ortaktır (FIRMNR kolonu ayırır)
IF OBJECT_ID('LG_SLSMAN') IS NOT NULL DROP TABLE LG_SLSMAN;
CREATE TABLE LG_SLSMAN (
  LOGICALREF int NOT NULL PRIMARY KEY,
  ACTIVE smallint NOT NULL DEFAULT 0,
  FIRMNR smallint NOT NULL,
  CODE varchar(25) NOT NULL,
  DEFINITION_ varchar(51) NOT NULL,
  POSITION_ varchar(51) NULL,
  TELNUMBER varchar(31) NULL,
  EMAILADDR varchar(251) NULL
);

-- Bordro Plus personel tablosu (sadeleştirilmiş). Gerçek kolonlar firmanın sürümünde doğrulanmalı.
IF OBJECT_ID('${PERSON}') IS NOT NULL DROP TABLE ${PERSON};
CREATE TABLE ${PERSON} (
  LREF int NOT NULL PRIMARY KEY,
  CODE varchar(25) NOT NULL,
  NAME varchar(51) NOT NULL,
  SURNAME varchar(51) NOT NULL,
  TTFNO varchar(16) NULL,
  INUSE smallint NOT NULL DEFAULT 1
);
`;

async function main() {
  const master = await new sql.ConnectionPool({ ...baseConfig, database: 'master' }).connect();
  await master.request().query(
    `IF DB_ID('${DB}') IS NULL CREATE DATABASE ${DB} COLLATE Turkish_CI_AS;`,
  );
  await master.close();

  const pool = await new sql.ConnectionPool({ ...baseConfig, database: DB }).connect();
  await pool.request().batch(schema);

  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => customer(i + 1));
  const clTable = new sql.Table(CLCARD);
  clTable.create = false;
  const cols = {
    LOGICALREF: sql.Int, ACTIVE: sql.SmallInt, CARDTYPE: sql.SmallInt,
    CODE: sql.VarChar(101), DEFINITION_: sql.VarChar(201), SPECODE: sql.VarChar(11),
    ADDR1: sql.VarChar(201), ADDR2: sql.VarChar(201), CITY: sql.VarChar(51), TOWN: sql.VarChar(51),
    COUNTRY: sql.VarChar(51), TELNRS1: sql.VarChar(51), TELNRS2: sql.VarChar(51),
    TAXNR: sql.VarChar(16), TAXOFFICE: sql.VarChar(31), EMAILADDR: sql.VarChar(251),
    ISPERSCOMP: sql.SmallInt, TCKNO: sql.VarChar(16), NAME: sql.VarChar(51), SURNAME: sql.VarChar(51),
    CAPIBLOCK_CREADEDDATE: sql.DateTime, CAPIBLOCK_MODIFIEDDATE: sql.DateTime,
  };
  const notNull = new Set(['LOGICALREF', 'ACTIVE', 'CARDTYPE', 'CODE', 'DEFINITION_', 'ISPERSCOMP']);
  for (const [name, type] of Object.entries(cols)) {
    clTable.columns.add(name, type, { nullable: !notNull.has(name), primary: name === 'LOGICALREF' });
  }
  for (const c of customers) clTable.rows.add(...Object.keys(cols).map((k) => c[k]));
  await pool.request().bulk(clTable);

  for (let i = 1; i <= 8; i++) {
    const name = `${faker.person.firstName()} ${faker.person.lastName()}`;
    await pool.request()
      .input('ref', sql.Int, i)
      .input('active', sql.SmallInt, i === 8 ? 1 : 0)
      .input('firm', sql.SmallInt, Number(FIRM))
      .input('code', sql.VarChar, `SE${String(i).padStart(3, '0')}`)
      .input('def', sql.VarChar, name)
      .input('pos', sql.VarChar, faker.helpers.arrayElement(POSITIONS))
      .input('tel', sql.VarChar, phone())
      .input('mail', sql.VarChar, `${ascii(name.split(' ')[0])}@lastikpark.example.com`)
      .query(`INSERT INTO LG_SLSMAN (LOGICALREF, ACTIVE, FIRMNR, CODE, DEFINITION_, POSITION_, TELNUMBER, EMAILADDR)
              VALUES (@ref, @active, @firm, @code, @def, @pos, @tel, @mail)`);
  }

  for (let i = 1; i <= 15; i++) {
    await pool.request()
      .input('ref', sql.Int, i)
      .input('code', sql.VarChar, `P${String(i).padStart(4, '0')}`)
      .input('name', sql.VarChar, faker.person.firstName())
      .input('surname', sql.VarChar, faker.person.lastName())
      .input('tc', sql.VarChar, tckn())
      .input('inuse', sql.SmallInt, i > 13 ? 0 : 1)
      .query(`INSERT INTO ${PERSON} (LREF, CODE, NAME, SURNAME, TTFNO, INUSE)
              VALUES (@ref, @code, @name, @surname, @tc, @inuse)`);
  }

  await pool.close();
  console.log(`✓ ${DB}: ${CLCARD} (${customers.length} müşteri), LG_SLSMAN (8), ${PERSON} (15)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
