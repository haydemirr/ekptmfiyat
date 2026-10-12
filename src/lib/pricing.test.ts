import { describe, expect, it } from "vitest";

import {
  PLANS,
  PricingError,
  calculateQuote,
  comparePlans,
  expectedAdjacentGapKurus,
  fiyatHesapla,
  foldLabel,
  formatAmount,
  formatPercent,
  formatTry,
  formulaExpression,
  gapExpression,
  quotePayload,
  tierStep,
  toplamUcret,
  verifyPublishedSheet,
  YEARLY_DISCOUNT_RATIO,
} from "./pricing";

describe("yayımlanan tablo", () => {
  it("24 hücrenin hepsini tutturur", () => {
    const checks = verifyPublishedSheet();
    expect(checks).toHaveLength(24);
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("aylık 50 kullanıcıda üç paketi tablo fiyatıyla verir", () => {
    expect(toplamUcret("temel", 50, "aylik")).toBe(340_000);
    expect(toplamUcret("kobi", 50, "aylik")).toBe(477_500);
    expect(toplamUcret("pro", 50, "aylik")).toBe(615_000);
    expect(formatTry(toplamUcret("starter", 50))).toBe("3.400 TL");
    expect(formatTry(toplamUcret("standart", 50))).toBe("4.775 TL");
    expect(formatTry(toplamUcret("professional", 50))).toBe("6.150 TL");
  });

  it("yıllık 100 kullanıcıda üç paketi tablo fiyatıyla verir", () => {
    expect(formatTry(toplamUcret("TEMEL", 100, "yıllık"))).toBe("59.000 TL");
    expect(formatTry(toplamUcret("KOBİ", 100, "yillik"))).toBe("79.000 TL");
    expect(formatTry(toplamUcret("PRO", 100, "yearly"))).toBe("99.000 TL");
  });
});

describe("formül", () => {
  it("professional 50 örneğini görseldeki ifadeyle yazar", () => {
    const quote = fiyatHesapla("professional", 50, "aylık");
    expect(formulaExpression(quote)).toBe(
      "3.900 + ((50 − 20) × 75) = 6.150 TL/ay",
    );
    expect(quote.packageFeeKurus + quote.extraFeeKurus).toBe(quote.totalKurus);
  });

  it("KOBİ yarım lirayı kuruşta kayıpsız taşır", () => {
    const quote = fiyatHesapla("kobi", 50, "aylik");
    expect(formulaExpression(quote)).toBe(
      "2.900 + ((50 − 20) × 62,50) = 4.775 TL/ay",
    );
    expect(quote.extraFeeKurus).toBe(187_500);
  });

  it("yıllık PRO 100 ifadesi paket ve ek koltuğu 10 aya yayar", () => {
    const quote = fiyatHesapla("pro", 100, "yillik");
    expect(formulaExpression(quote)).toBe(
      "39.000 + ((100 − 20) × 750) = 99.000 TL/yıl",
    );
    expect(quote.totalKurus).toBe(quote.monthlyTotalKurus * 10);
    expect(quote.yearlySavingsKurus).toBe(quote.monthlyTotalKurus * 2);
    expect(quote.twelveMonthListKurus - quote.totalKurus).toBe(
      quote.yearlySavingsKurus,
    );
  });

  it("20 ve altında yalnız paket ücretini alır", () => {
    for (const users of [1, 19, 20]) {
      for (const plan of PLANS) {
        const quote = calculateQuote(plan.id, users, "monthly");
        expect(quote.extraUsers).toBe(0);
        expect(quote.extraFeeKurus).toBe(0);
        expect(quote.totalKurus).toBe(plan.monthlyBaseKurus);
      }
    }
  });

  it("35 kullanıcıda tablo hücresi aramadan hesaplar", () => {
    expect(formatTry(toplamUcret("temel", 35))).toBe("2.650 TL");
    expect(formatTry(toplamUcret("kobi", 35))).toBe("3.837,50 TL");
    expect(formatTry(toplamUcret("pro", 35))).toBe("5.025 TL");
    expect(formatTry(toplamUcret("temel", 35, "yillik"))).toBe("26.500 TL");
    expect(formatTry(toplamUcret("kobi", 35, "yillik"))).toBe("38.375 TL");
    expect(formatTry(toplamUcret("pro", 35, "yillik"))).toBe("50.250 TL");
  });

  it("21. kullanıcıda tek ek birim ekler", () => {
    expect(formatTry(toplamUcret("temel", 21))).toBe("1.950 TL");
    expect(formatTry(toplamUcret("kobi", 21))).toBe("2.962,50 TL");
    expect(formatTry(toplamUcret("pro", 21))).toBe("3.975 TL");
  });

  it("1 ile 120 arasındaki her kadroda kimliği korur", () => {
    for (let users = 1; users <= 120; users += 1) {
      for (const plan of PLANS) {
        const monthly = calculateQuote(plan.id, users, "monthly");
        const yearly = calculateQuote(plan.id, users, "yearly");
        expect(monthly.packageFeeKurus + monthly.extraFeeKurus).toBe(
          monthly.totalKurus,
        );
        expect(yearly.packageFeeKurus + yearly.extraFeeKurus).toBe(
          yearly.totalKurus,
        );
        expect(yearly.totalKurus).toBe(monthly.totalKurus * 10);
        expect(yearly.extraUnitKurus).toBe(monthly.extraUnitKurus * 10);
        expect(yearly.packageFeeKurus).toBe(monthly.packageFeeKurus * 10);
      }
    }
  });
});

describe("analiz", () => {
  it("komşu paketleri eşit aralıkla dizer", () => {
    const step = tierStep();
    expect(step.even).toBe(true);
    expect(formatTry(step.baseStepKurus)).toBe("1.000 TL");
    expect(formatTry(step.extraStepKurus)).toBe("12,50 TL");

    for (const users of [1, 20, 21, 35, 50, 100, 250]) {
      for (const billing of ["monthly", "yearly"] as const) {
        const compared = comparePlans(users, billing);
        expect(compared.evenlySpaced).toBe(true);
        expect(compared.gapKurus).toBe(
          expectedAdjacentGapKurus(users, billing),
        );
      }
    }
  });

  it("50 aylık ve 100 yıllık aralığı açık yazar", () => {
    expect(gapExpression(50, "monthly")).toBe(
      "1.000 + (30 × 12,50) = 1.375 TL",
    );
    expect(gapExpression(100, "yearly")).toBe(
      "(1.000 + (80 × 12,50)) × 10 = 20.000 TL",
    );
  });

  it("yıllık avantajı 12 ayın 2 ayı olarak %16,67 yazar", () => {
    expect(YEARLY_DISCOUNT_RATIO).toBeCloseTo(1 / 6);
    expect(formatPercent(YEARLY_DISCOUNT_RATIO)).toBe("%16,67");
  });
});

describe("kenarlar", () => {
  it("Türkçe paket ve dönem adlarını çözer", () => {
    expect(foldLabel("KOBİ")).toBe("kobi");
    expect(foldLabel("Yıllık")).toBe("yillik");
    expect(fiyatHesapla("  Professional ", 20, "Yıllık").totalKurus).toBe(
      3_900_000,
    );
  });

  it("bozuk girdiyi reddeder", () => {
    expect(() => fiyatHesapla("free", 5)).toThrow(PricingError);
    expect(() => fiyatHesapla("pro", 10, "haftalik")).toThrow(PricingError);
    expect(() => fiyatHesapla("pro", 0)).toThrow(/en az 1/);
    expect(() => fiyatHesapla("pro", -3)).toThrow(PricingError);
    expect(() => fiyatHesapla("pro", 1.5)).toThrow(/tam sayı/);
    expect(() => fiyatHesapla("pro", Number.NaN)).toThrow(PricingError);
    expect(() => fiyatHesapla("pro", 100_001)).toThrow(/100\.000/);
  });

  it("tutar biçimi tablodaki yazıma uyar", () => {
    expect(formatAmount(190_000)).toBe("1.900");
    expect(formatAmount(6_250)).toBe("62,50");
    expect(formatAmount(62_500)).toBe("625");
    expect(formatTry(4_775_000)).toBe("47.750 TL");
  });

  it("API gövdesi PRO 50 aylık örneğini taşır", () => {
    const payload = quotePayload(fiyatHesapla("pro", 50, "aylik"));
    expect(payload.total).toBe("6.150 TL");
    expect(payload.formula).toBe("3.900 + ((50 − 20) × 75) = 6.150 TL/ay");
    expect(payload.extraUsers).toBe(30);
    expect(payload.extraFee).toBe("2.250 TL");
  });
});
