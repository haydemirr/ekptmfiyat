/**
 * Yeni fiyatlandırma.
 *
 * Toplam Ücret = Paket Ücreti + ((Kullanıcı Sayısı − 20) × Ek Kullanıcı Birim Ücreti)
 * Yıllık ücret = aylık toplam × 10.
 *
 * Tutarlar kuruştur (1 TL = 100 kuruş). 62,50 TL gibi yarım lira
 * birimler kayan noktaya düşmeden tam sayıda kalır.
 *
 * Paket adları: Starter → TEMEL, Standard → KOBİ, Professional → PRO.
 */

export const INCLUDED_USERS = 20;
export const YEARLY_PAID_MONTHS = 10;
export const YEARLY_USAGE_MONTHS = 12;
export const MIN_USERS = 1;
export const MAX_USERS = 100_000;

export const YEARLY_DISCOUNT_RATIO =
  (YEARLY_USAGE_MONTHS - YEARLY_PAID_MONTHS) / YEARLY_USAGE_MONTHS;

export const PRICE_RULE =
  "Toplam Ücret = Paket Ücreti + ((Kullanıcı Sayısı − 20) × Ek Kullanıcı Birim Ücreti)";

export const YEARLY_RULE =
  "Yıllık abonelik ücreti, aylık toplamın 10 katıdır.";

export const PLANS = [
  {
    id: "temel",
    name: "TEMEL",
    formerName: "Starter",
    monthlyBaseKurus: 190_000,
    monthlyExtraKurus: 5_000,
  },
  {
    id: "kobi",
    name: "KOBİ",
    formerName: "Standard",
    monthlyBaseKurus: 290_000,
    monthlyExtraKurus: 6_250,
  },
  {
    id: "pro",
    name: "PRO",
    formerName: "Professional",
    monthlyBaseKurus: 390_000,
    monthlyExtraKurus: 7_500,
  },
] as const;

export type Plan = (typeof PLANS)[number];
export type PlanId = Plan["id"];
export type BillingPeriod = "monthly" | "yearly";

export type PricingErrorCode =
  | "not_integer"
  | "too_small"
  | "too_large"
  | "unknown_plan"
  | "unknown_billing";

export class PricingError extends Error {
  readonly code: PricingErrorCode;

  constructor(message: string, code: PricingErrorCode) {
    super(message);
    this.name = "PricingError";
    this.code = code;
  }
}

const PLAN_ALIASES: Record<string, PlanId> = {
  temel: "temel",
  starter: "temel",
  kobi: "kobi",
  standard: "kobi",
  standart: "kobi",
  pro: "pro",
  professional: "pro",
  profesyonel: "pro",
};

const BILLING_ALIASES: Record<string, BillingPeriod> = {
  monthly: "monthly",
  month: "monthly",
  aylik: "monthly",
  ay: "monthly",
  yearly: "yearly",
  year: "yearly",
  yillik: "yearly",
  yil: "yearly",
};

/** Sheet cells, transcribed in kuruş. Not derived from the formula. */
const PUBLISHED_TOTALS: Record<
  BillingPeriod,
  Record<PlanId, Record<20 | 50 | 100, number>>
> = {
  monthly: {
    temel: { 20: 190_000, 50: 340_000, 100: 590_000 },
    kobi: { 20: 290_000, 50: 477_500, 100: 790_000 },
    pro: { 20: 390_000, 50: 615_000, 100: 990_000 },
  },
  yearly: {
    temel: { 20: 1_900_000, 50: 3_400_000, 100: 5_900_000 },
    kobi: { 20: 2_900_000, 50: 4_775_000, 100: 7_900_000 },
    pro: { 20: 3_900_000, 50: 6_150_000, 100: 9_900_000 },
  },
};

const PUBLISHED_EXTRA: Record<BillingPeriod, Record<PlanId, number>> = {
  monthly: { temel: 5_000, kobi: 6_250, pro: 7_500 },
  yearly: { temel: 50_000, kobi: 62_500, pro: 75_000 },
};

export type Quote = {
  planId: PlanId;
  planName: string;
  formerName: string;
  userCount: number;
  billing: BillingPeriod;
  includedUsers: number;
  extraUsers: number;
  packageFeeKurus: number;
  extraUnitKurus: number;
  extraFeeKurus: number;
  totalKurus: number;
  monthlyTotalKurus: number;
  twelveMonthListKurus: number;
  yearlySavingsKurus: number;
};

export type SheetCheck = {
  planId: PlanId;
  planName: string;
  billing: BillingPeriod;
  kind: "total" | "extra";
  users: number | null;
  expectedKurus: number;
  actualKurus: number;
  ok: boolean;
};

export function foldLabel(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function assertUserCount(userCount: number): void {
  if (!Number.isInteger(userCount)) {
    throw new PricingError("Kullanıcı sayısı tam sayı olmalı.", "not_integer");
  }
  if (userCount < MIN_USERS) {
    throw new PricingError("Kullanıcı sayısı en az 1 olmalı.", "too_small");
  }
  if (userCount > MAX_USERS) {
    throw new PricingError(
      "Kullanıcı sayısı en fazla 100.000 olabilir.",
      "too_large",
    );
  }
}

export function parseUserCount(raw: string): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new PricingError("Kullanıcı sayısı tam sayı olmalı.", "not_integer");
  }
  const value = Number(trimmed);
  assertUserCount(value);
  return value;
}

export function resolvePlanId(input: string): PlanId {
  const planId = PLAN_ALIASES[foldLabel(input)];
  if (!planId) {
    throw new PricingError(
      "Paket TEMEL, KOBİ veya PRO olmalı.",
      "unknown_plan",
    );
  }
  return planId;
}

export function resolveBilling(input: string): BillingPeriod {
  const billing = BILLING_ALIASES[foldLabel(input)];
  if (!billing) {
    throw new PricingError("Dönem aylık veya yıllık olmalı.", "unknown_billing");
  }
  return billing;
}

export function getPlan(planId: PlanId): Plan {
  const plan = PLANS.find((item) => item.id === planId);
  if (!plan) {
    throw new PricingError(
      "Paket TEMEL, KOBİ veya PRO olmalı.",
      "unknown_plan",
    );
  }
  return plan;
}

export function extraUserCount(userCount: number): number {
  assertUserCount(userCount);
  return Math.max(0, userCount - INCLUDED_USERS);
}

/**
 * Aylık ya da yıllık ücreti, dökümüyle birlikte hesaplar.
 * 20 ve altındaki kadrolarda ek tutar sıfırdır; paket ücreti aynen kalır.
 */
export function calculateQuote(
  planId: PlanId,
  userCount: number,
  billing: BillingPeriod,
): Quote {
  const plan = getPlan(planId);
  const extraUsers = extraUserCount(userCount);
  const monthlyTotalKurus =
    plan.monthlyBaseKurus + extraUsers * plan.monthlyExtraKurus;
  const multiplier = billing === "yearly" ? YEARLY_PAID_MONTHS : 1;
  const packageFeeKurus = plan.monthlyBaseKurus * multiplier;
  const extraUnitKurus = plan.monthlyExtraKurus * multiplier;
  const extraFeeKurus = extraUsers * extraUnitKurus;
  const totalKurus = monthlyTotalKurus * multiplier;

  if (packageFeeKurus + extraFeeKurus !== totalKurus) {
    throw new Error("Ücret kimliği bozuldu.");
  }

  return {
    planId: plan.id,
    planName: plan.name,
    formerName: plan.formerName,
    userCount,
    billing,
    includedUsers: INCLUDED_USERS,
    extraUsers,
    packageFeeKurus,
    extraUnitKurus,
    extraFeeKurus,
    totalKurus,
    monthlyTotalKurus,
    twelveMonthListKurus: monthlyTotalKurus * YEARLY_USAGE_MONTHS,
    yearlySavingsKurus: monthlyTotalKurus * (YEARLY_USAGE_MONTHS - YEARLY_PAID_MONTHS),
  };
}

/** Türkçe paket ve dönem adlarını da kabul eden dış fonksiyon. */
export function fiyatHesapla(
  plan: string,
  kullaniciSayisi: number,
  donem: string = "aylik",
): Quote {
  return calculateQuote(
    resolvePlanId(plan),
    kullaniciSayisi,
    resolveBilling(donem),
  );
}

export function toplamUcret(
  plan: string,
  kullaniciSayisi: number,
  donem: string = "aylik",
): number {
  return fiyatHesapla(plan, kullaniciSayisi, donem).totalKurus;
}

export function formatAmount(kurus: number): string {
  if (!Number.isInteger(kurus)) {
    throw new Error("Tutar kuruş cinsinden tam sayı olmalı.");
  }
  const sign = kurus < 0 ? "-" : "";
  const abs = Math.abs(kurus);
  const lira = Math.trunc(abs / 100);
  const fraction = abs % 100;
  const liraText = new Intl.NumberFormat("tr-TR").format(lira);
  if (fraction === 0) return `${sign}${liraText}`;
  return `${sign}${liraText},${String(fraction).padStart(2, "0")}`;
}

export function formatTry(kurus: number): string {
  return `${formatAmount(kurus)} TL`;
}

export function formatPercent(ratio: number): string {
  const hundredths = Math.round(ratio * 10_000);
  const whole = Math.trunc(hundredths / 100);
  const fraction = Math.abs(hundredths % 100);
  return `%${new Intl.NumberFormat("tr-TR").format(whole)},${String(fraction).padStart(2, "0")}`;
}

export function formulaExpression(quote: Quote): string {
  const total = `${formatTry(quote.totalKurus)}/${quote.billing === "monthly" ? "ay" : "yıl"}`;
  const packageAmount = formatAmount(quote.packageFeeKurus);
  if (quote.extraUsers === 0) {
    return `${packageAmount} TL = ${total}`;
  }
  return `${packageAmount} + ((${quote.userCount} − 20) × ${formatAmount(quote.extraUnitKurus)}) = ${total}`;
}

export function perUserAmount(
  totalKurus: number,
  users: number,
): { kurus: number; exact: boolean } {
  assertUserCount(users);
  if (!Number.isInteger(totalKurus)) {
    throw new Error("Tutar kuruş cinsinden tam sayı olmalı.");
  }
  return {
    kurus: Math.round(totalKurus / users),
    exact: totalKurus % users === 0,
  };
}

export function tierStep(): {
  baseStepKurus: number;
  extraStepKurus: number;
  even: boolean;
} {
  const baseStepKurus = PLANS[1].monthlyBaseKurus - PLANS[0].monthlyBaseKurus;
  const extraStepKurus = PLANS[1].monthlyExtraKurus - PLANS[0].monthlyExtraKurus;
  const baseEven =
    PLANS[2].monthlyBaseKurus - PLANS[1].monthlyBaseKurus === baseStepKurus;
  const extraEven =
    PLANS[2].monthlyExtraKurus - PLANS[1].monthlyExtraKurus === extraStepKurus;
  return { baseStepKurus, extraStepKurus, even: baseEven && extraEven };
}

export function expectedAdjacentGapKurus(
  userCount: number,
  billing: BillingPeriod,
): number {
  const extra = extraUserCount(userCount);
  const step = tierStep();
  const monthlyGap = step.baseStepKurus + extra * step.extraStepKurus;
  return billing === "yearly" ? monthlyGap * YEARLY_PAID_MONTHS : monthlyGap;
}

export function gapExpression(userCount: number, billing: BillingPeriod): string {
  const step = tierStep();
  const extra = extraUserCount(userCount);
  const gap = expectedAdjacentGapKurus(userCount, billing);
  const core = `${formatAmount(step.baseStepKurus)} + (${extra} × ${formatAmount(step.extraStepKurus)})`;
  if (billing === "yearly") {
    return `(${core}) × ${YEARLY_PAID_MONTHS} = ${formatTry(gap)}`;
  }
  return `${core} = ${formatTry(gap)}`;
}

export function comparePlans(userCount: number, billing: BillingPeriod) {
  const quotes = PLANS.map((plan) =>
    calculateQuote(plan.id, userCount, billing),
  );
  const gaps = [
    quotes[1].totalKurus - quotes[0].totalKurus,
    quotes[2].totalKurus - quotes[1].totalKurus,
  ];
  return {
    quotes,
    gaps,
    evenlySpaced: gaps[0] === gaps[1],
    gapKurus: gaps[0],
  };
}

export function verifyPublishedSheet(): SheetCheck[] {
  const checks: SheetCheck[] = [];
  const periods: BillingPeriod[] = ["monthly", "yearly"];
  const seats = [20, 50, 100] as const;

  for (const billing of periods) {
    for (const plan of PLANS) {
      for (const users of seats) {
        const actualKurus = calculateQuote(plan.id, users, billing).totalKurus;
        const expectedKurus = PUBLISHED_TOTALS[billing][plan.id][users];
        checks.push({
          planId: plan.id,
          planName: plan.name,
          billing,
          kind: "total",
          users,
          expectedKurus,
          actualKurus,
          ok: actualKurus === expectedKurus,
        });
      }

      const extraUnitKurus = calculateQuote(plan.id, 21, billing).extraUnitKurus;
      const expectedExtra = PUBLISHED_EXTRA[billing][plan.id];
      checks.push({
        planId: plan.id,
        planName: plan.name,
        billing,
        kind: "extra",
        users: null,
        expectedKurus: expectedExtra,
        actualKurus: extraUnitKurus,
        ok: extraUnitKurus === expectedExtra,
      });
    }
  }

  return checks;
}

export function quotePayload(quote: Quote) {
  const perUser = perUserAmount(quote.totalKurus, quote.userCount);
  return {
    planId: quote.planId,
    plan: quote.planName,
    formerName: quote.formerName,
    users: quote.userCount,
    billing: quote.billing,
    includedUsers: quote.includedUsers,
    extraUsers: quote.extraUsers,
    packageFeeKurus: quote.packageFeeKurus,
    packageFee: formatTry(quote.packageFeeKurus),
    extraUnitKurus: quote.extraUnitKurus,
    extraUnit: formatTry(quote.extraUnitKurus),
    extraFeeKurus: quote.extraFeeKurus,
    extraFee: formatTry(quote.extraFeeKurus),
    totalKurus: quote.totalKurus,
    total: formatTry(quote.totalKurus),
    formula: formulaExpression(quote),
    monthlyTotalKurus: quote.monthlyTotalKurus,
    monthlyTotal: formatTry(quote.monthlyTotalKurus),
    twelveMonthListKurus: quote.twelveMonthListKurus,
    twelveMonthList: formatTry(quote.twelveMonthListKurus),
    yearlySavingsKurus: quote.yearlySavingsKurus,
    yearlySavings: formatTry(quote.yearlySavingsKurus),
    perUserKurus: perUser.exact ? perUser.kurus : null,
    perUser: perUser.exact ? formatTry(perUser.kurus) : null,
  };
}
