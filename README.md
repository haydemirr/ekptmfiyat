# Yeni fiyatlandırma

TEMEL, KOBİ ve PRO paketlerinin aylık ve yıllık ücretini tek fonksiyondan hesaplar.

Starter → **TEMEL**, Standard → **KOBİ**, Professional → **PRO**.

```
Toplam Ücret = Paket Ücreti + ((Kullanıcı Sayısı − 20) × Ek Kullanıcı Birim Ücreti)
Yıllık ücret = aylık toplam × 10
```

20 kullanıcı paket ücretine dahildir. Daha küçük kadrolarda da paket ücreti aynen kalır. Yıllık ödemede 12 ay kullanım, 10 ay tahsilat vardır; avantaj %16,67.

Tutarlar kuruş cinsinden tam sayıdır. KOBİ ek koltuğu 62,50 TL olduğu için kayan nokta kullanılmaz.

## İstenen iki senaryo

Aylık, 50 kullanıcı:

| Paket | Ücret |
| --- | --- |
| TEMEL | 3.400 TL |
| KOBİ | 4.775 TL |
| PRO | 6.150 TL |

Yıllık, 100 kullanıcı:

| Paket | Ücret |
| --- | --- |
| TEMEL | 59.000 TL |
| KOBİ | 79.000 TL |
| PRO | 99.000 TL |

PRO, 50 kullanıcı örneği: `3.900 + ((50 − 20) × 75) = 6.150 TL/ay`.

## Çalıştırma

```bash
npm install
npm run dev
```

Uygulama [http://127.0.0.1:4317](http://127.0.0.1:4317) adresinde açılır.

```bash
npm test
npm run lint
```

## Fonksiyon

`fiyatHesapla(plan, kullaniciSayisi, donem)` sonucu kuruş dökümüyle döner. `toplamUcret` yalnız toplam kuruşu verir.

```ts
import { fiyatHesapla, toplamUcret } from "@/lib/pricing";

fiyatHesapla("pro", 50, "aylik");
toplamUcret("KOBİ", 100, "yıllık"); // 7_900_000 kuruş = 79.000 TL
```

Paket takma adları: `starter`, `temel`, `standard`, `standart`, `kobi`, `professional`, `profesyonel`, `pro`.

Dönem: `aylik`, `aylık`, `monthly`, `yillik`, `yıllık`, `yearly`.

HTTP:

```bash
curl "http://127.0.0.1:4317/api/quote?plan=pro&users=50&billing=aylik"
curl "http://127.0.0.1:4317/api/scenarios"
```
