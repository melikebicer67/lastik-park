# Lastik Park

LOGO ERP kullanan lastik oteli firması için depolama takip uygulaması.
Müşteri ve personel bilgileri LOGO'dan **sadece okunur**; lastik parka ait veriler uygulamanın kendi veritabanında tutulur.

```
web (Next.js :3000)  ──►  api (NestJS :3001)
                            ├── PostgreSQL :5433   → uygulama verisi (Prisma)
                            └── LOGO SQL Server    → LG_{firma}_CLCARD, LG_SLSMAN, LH_{firma}_PERSON
                                  ├── geliştirme: sahte LOGODEMO (konteyner, :1433)
                                  └── demo/üretim: firmanın gerçek LOGO sunucusu
```

## Gereksinimler

- Node 22 (`nvm use`)
- Podman + podman-compose (veya Docker Compose)

## Kurulum

```bash
# 1. Veritabanları
podman-compose up -d            # docker compose up -d

# 2. Sahte LOGO veritabanı (LOGO tablo yapısında, Türkçe örnek veri)
cd logo-demo-db && cp .env.example .env && npm install && npm run seed && cd ..

# 3. API
cd api && cp .env.example .env && npm install && npm run db:migrate && npm run start:dev

# 4. Ön yüz (ayrı terminalde)
cd web && cp .env.example .env.local && npm install && npm run dev
```

http://localhost:3000 adresinden açılır.

## Gerçek LOGO verisine geçmek (demo)

1. **LOGO Ayarları** ekranında firmanın SQL Server adresi, veritabanı, kullanıcı, şifre, firma ve dönem numarası girilir.
2. **Bağlantıyı test et** ile bağlantı ve tablolar (müşteri/personel sayıları) kontrol edilir.
3. **Kaydet** ile uygulama anında gerçek veriye geçer; sağ üstteki etiket yeşile döner.
4. Demo bitince **Örnek veriye dön** ile kayıtlı bağlantı silinir.

Notlar:
- Firmada sadece okuma yetkisi olan (`db_datareader`) bir SQL kullanıcısı istenmeli.
- Şifre veritabanında AES-256-GCM ile şifreli saklanır (`APP_SECRET`).
- Tüm LOGO sorguları `api/src/logo/logo.repository.ts` dosyasındadır; sürüm farkı çıkarsa düzeltilecek tek yer orasıdır.
- Bordro Plus personel tablosunun (`LH_xxx_PERSON`) kolonları firmanın sürümünde doğrulanmalıdır.

## API

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/settings/logo` | Aktif LOGO bağlantısı (şifresiz) |
| PUT | `/api/settings/logo` | Bağlantıyı kaydet |
| DELETE | `/api/settings/logo` | Örnek veritabanına dön |
| POST | `/api/logo/connection/test` | Formdaki bilgilerle bağlantı testi |
| GET | `/api/logo/customers?search=&page=&pageSize=&includePassive=` | Cari kartlar |
| GET | `/api/logo/customers/:ref` | Tek cari |
| GET | `/api/logo/salesmen` | Satış elemanları |
| GET | `/api/logo/personnel` | Bordro personeli |
