import {
  fiyatHesapla,
  formatPercent,
  PLANS,
  PRICE_RULE,
  quotePayload,
  verifyPublishedSheet,
  YEARLY_DISCOUNT_RATIO,
  YEARLY_RULE,
} from "@/lib/pricing";

export function GET() {
  const checks = verifyPublishedSheet();
  return Response.json({
    rule: PRICE_RULE,
    yearlyRule: YEARLY_RULE,
    yearlyDiscount: formatPercent(YEARLY_DISCOUNT_RATIO),
    monthly50: PLANS.map((plan) =>
      quotePayload(fiyatHesapla(plan.id, 50, "aylik")),
    ),
    yearly100: PLANS.map((plan) =>
      quotePayload(fiyatHesapla(plan.id, 100, "yillik")),
    ),
    sheet: {
      passed: checks.filter((check) => check.ok).length,
      total: checks.length,
      ok: checks.every((check) => check.ok),
    },
  });
}
