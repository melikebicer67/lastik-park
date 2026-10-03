import { Injectable, NotFoundException } from '@nestjs/common';
import sql from 'mssql';
import { LogoConnectionService } from './logo-connection.service.js';
import { CustomerQueryDto, LogoCustomer, LogoPerson, LogoSalesman } from './logo.dto.js';

// Tüm LOGO sorguları burada. Sürüm farkı çıkarsa düzeltilecek tek yer bu dosya.
// LOGO'ya kesinlikle yazılmaz; okumalar ERP'yi kilitlememek için NOLOCK ile yapılır.

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

// LIKE içindeki %, _ ve [ karakterlerini düz metin olarak arar
const likeEscape = (v: string) => v.replace(/[[%_]/g, '[$&]');

const CUSTOMER_COLUMNS = `
  LOGICALREF, CODE, DEFINITION_, ISPERSCOMP, NAME, SURNAME, TCKNO, TAXNR, TAXOFFICE,
  TELNRS1, TELNRS2, EMAILADDR, ADDR1, ADDR2, CITY, TOWN, SPECODE, CARDTYPE, ACTIVE`;

function mapCustomer(r: Record<string, unknown>): LogoCustomer {
  return {
    logoRef: r.LOGICALREF as number,
    code: s(r.CODE),
    name: s(r.DEFINITION_),
    isPerson: r.ISPERSCOMP === 1,
    firstName: s(r.NAME),
    lastName: s(r.SURNAME),
    tckn: s(r.TCKNO),
    taxNr: s(r.TAXNR),
    taxOffice: s(r.TAXOFFICE),
    phone: s(r.TELNRS1),
    phone2: s(r.TELNRS2),
    email: s(r.EMAILADDR),
    address: [s(r.ADDR1), s(r.ADDR2)].filter(Boolean).join(' '),
    city: s(r.CITY),
    town: s(r.TOWN),
    specialCode: s(r.SPECODE),
    cardType: r.CARDTYPE as number,
    active: r.ACTIVE === 0,
  };
}

@Injectable()
export class LogoRepository {
  constructor(private readonly connection: LogoConnectionService) {}

  async findCustomers(q: CustomerQueryDto) {
    const { pool, tables } = await this.connection.get();
    const search = q.search?.trim();
    const result = await pool
      .request()
      .input('search', sql.NVarChar, search ? `%${likeEscape(search)}%` : null)
      .input('includePassive', sql.Bit, q.includePassive)
      .input('skip', sql.Int, (q.page - 1) * q.pageSize)
      .input('take', sql.Int, q.pageSize)
      .query(`
        SELECT ${CUSTOMER_COLUMNS}, COUNT(*) OVER() AS TOTAL
        FROM ${tables.customers} WITH (NOLOCK)
        WHERE (@includePassive = 1 OR ACTIVE = 0)
          AND (@search IS NULL
               OR CODE LIKE @search OR DEFINITION_ LIKE @search
               OR TELNRS1 LIKE @search OR TELNRS2 LIKE @search
               OR TAXNR LIKE @search OR TCKNO LIKE @search)
        ORDER BY DEFINITION_
        OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`);
    const rows = result.recordset as Record<string, unknown>[];
    return {
      items: rows.map(mapCustomer),
      total: (rows[0]?.TOTAL as number) ?? 0,
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  async findCustomer(logoRef: number): Promise<LogoCustomer> {
    const { pool, tables } = await this.connection.get();
    const result = await pool
      .request()
      .input('ref', sql.Int, logoRef)
      .query(`SELECT ${CUSTOMER_COLUMNS} FROM ${tables.customers} WITH (NOLOCK) WHERE LOGICALREF = @ref`);
    const row = result.recordset[0] as Record<string, unknown> | undefined;
    if (!row) throw new NotFoundException(`LOGO'da ${logoRef} referanslı cari bulunamadı`);
    return mapCustomer(row);
  }

  async findSalesmen(): Promise<LogoSalesman[]> {
    const { pool, tables } = await this.connection.get();
    const result = await pool
      .request()
      .input('firm', sql.SmallInt, Number(tables.firmNo))
      .query(`
        SELECT LOGICALREF, CODE, DEFINITION_, POSITION_, TELNUMBER, EMAILADDR, ACTIVE
        FROM ${tables.salesmen} WITH (NOLOCK)
        WHERE FIRMNR = @firm
        ORDER BY DEFINITION_`);
    return (result.recordset as Record<string, unknown>[]).map((r) => ({
      logoRef: r.LOGICALREF as number,
      code: s(r.CODE),
      name: s(r.DEFINITION_),
      position: s(r.POSITION_),
      phone: s(r.TELNUMBER),
      email: s(r.EMAILADDR),
      active: r.ACTIVE === 0,
    }));
  }

  // Bordro Plus kullanmayan firmalarda tablo yoktur; o durumda available: false döner
  async findPersonnel(): Promise<{ available: boolean; items: LogoPerson[] }> {
    const { pool, tables } = await this.connection.get();
    const exists = await pool
      .request()
      .input('name', sql.NVarChar, tables.personnel)
      .query<{ id: number | null }>('SELECT OBJECT_ID(@name) AS id');
    if (exists.recordset[0].id === null) return { available: false, items: [] };

    const result = await pool.request().query(`
      SELECT LREF, CODE, NAME, SURNAME, INUSE
      FROM ${tables.personnel} WITH (NOLOCK)
      ORDER BY NAME, SURNAME`);
    return {
      available: true,
      items: (result.recordset as Record<string, unknown>[]).map((r) => ({
        logoRef: r.LREF as number,
        code: s(r.CODE),
        firstName: s(r.NAME),
        lastName: s(r.SURNAME),
        active: r.INUSE === 1,
      })),
    };
  }
}
