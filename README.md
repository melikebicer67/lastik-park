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

Veri modeli taslağı ve firmaya sorulacaklar: [docs/veri-modeli.md](docs/veri-modeli.md)

## Gereksinimler

- Node 22 (`nvm use`)
- Podman + podman-compose (veya Docker Compose)

## Kurulum

```bash
nvm use                         # Node 22

# 1. Veritabanları
podman-compose up -d            # docker compose up -d

# 2. Sahte LOGO veritabanı (LOGO tablo yapısında, Türkçe örnek veri)
cd logo-demo-db && cp .env.example .env && npm install && npm run seed && cd ..

# 3. API: bağımlılıklar, tablolar, örnek depo (1 şube, 120 göz)
cd api && cp .env.example .env && npm install && npm run db:migrate && npm run db:seed && cd ..

# 4. Ön yüz
cd web && cp .env.example .env.local && npm install && cd ..

# (İsteğe bağlı) Demo verisi: 110 müşteri, 160 araç, ~150 lastik takımı. Müşteri/lastik tablolarını sıfırlar!
cd api && npm run db:demo && cd ..

# 5. Hepsini birlikte çalıştır (kök dizinde)
npm install && yarn dev         # veya npm run dev
```

http://localhost:3000 adresinden açılır.

## Ekranlar

- **Lastik Bul** (`/lastikler`, açılış sayfası): plaka, müşteri, telefon, marka, göz veya etiket no ile arama; durum/mevsim filtresi. Her satırda takımın bulunduğu göz. Etiket numarası yazılıp Enter'a basılınca (el tipi barkod okuyucu da böyle çalışır) doğrudan takıma gider. **QR okut** kamerayla okur (HTTPS veya localhost gerekir).
- **Lastik Kabul** (`/kabul`): müşteri (LOGO'dan) → araç → lastikler → depo gözü → ücret. Kayıt sonrası QR kodlu etiket sayfasına gider.
- **Lastik Teslim** (`/teslim`): QR/etiket no/plaka ile takımı bul → raftan alınacak göz, kabul tarihi ve depoda kalma süresi büyük gösterilir → ek parça kontrolü, tahsilat, teslim eden personel → teslim. Ekranda müşterinin geçmişi de görünür. Sonrasında "araçtaki lastikleri depoya al" ile sezon değişimi için kabul ekranı müşteri, araç ve mevsim seçili açılır.
- **Müşteri geçmişi** (`/musteri/:id`): tüm kabul/teslim kayıtları, süreler, gözler, ücret ve ödeme durumu, personel; özet ve A4 yazdırma.
- **Depo** (`/depo`): koridor/raf/kat haritası, mevsime göre renkli; doluluk özeti; haritada plaka/müşteri vurgulama. `?goz=B-04-2` ile gözü işaretler.
- **Takım detayı** (`/takim/:id`): lastikler, konaklama, teslim alan personel, etiket, "Depoda göster".
- **Etiketler** (`/etiketler`): depodaki tüm takımların etiketleri; yazdırınca her biri ayrı 100×60 mm sayfa.
- **Müşteriler**, **Personel**: LOGO'dan canlı okuma.
- **LOGO Ayarları**: bağlantı bilgileri, test, örnek veriye dönüş.

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
| POST | `/api/customers/from-logo/:logoRef` | LOGO carisini uygulamaya al |
| GET | `/api/customers/:id` | Müşteri ve araçları |
| POST | `/api/vehicles` | Araç ekle (plaka doğrulanır) |
| GET | `/api/storage/warehouses` | Depolar |
| GET | `/api/storage/warehouses/:id/locations?onlyAvailable=true` | Gözler ve doluluk |
| GET | `/api/storage/warehouses/:id/map` | Depo haritası ve doluluk |
| GET | `/api/tire-sets?search=&status=&season=&page=&pageSize=` | Lastik takımı arama |
| GET | `/api/tire-sets/by-code/:code` | Etiket (QR) numarasından takım |
| POST | `/api/tire-sets/check-in` | Lastik kabulü |
| POST | `/api/tire-sets/:id/check-out` | Lastik teslimi |
| GET | `/api/customers/:id/history` | Müşteri geçmişi raporu |
| GET | `/api/employees` | Personel listesi (işlemi yapan seçimi) |
| GET | `/api/tire-sets/:id` | Takım detayı |
