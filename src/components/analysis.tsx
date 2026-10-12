import {
  INCLUDED_USERS,
  PLANS,
  YEARLY_PAID_MONTHS,
  YEARLY_USAGE_MONTHS,
  extraUserCount,
  fiyatHesapla,
  formatPercent,
  formatTry,
  gapExpression,
  perUserAmount,
  tierStep,
  YEARLY_DISCOUNT_RATIO,
} from "@/lib/pricing";

const seats = [20, 50, 100] as const;

const tone = {
  temel: "text-tier-temel",
  kobi: "text-tier-kobi",
  pro: "text-tier-pro",
} as const;

export function Analysis() {
  const step = tierStep();
  const edge = PLANS.map((plan) => fiyatHesapla(plan.id, INCLUDED_USERS + 1, "aylik"));
  const yearly100 = PLANS.map((plan) => fiyatHesapla(plan.id, 100, "yillik"));

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl tracking-tight">Fiyat analizi</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Üç paket eşit basamaklı. Tabanlar arasında {formatTry(step.baseStepKurus)},
          ek kullanıcı birimleri arasında {formatTry(step.extraStepKurus)} var.
          Kadro büyüdükçe kişi başı ücret ek birime yaklaşır; taban daha çok
          kişiye yayılır.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
            50 kullanıcı · aylık aralık
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">
            {formatTry(
              fiyatHesapla("kobi", 50).totalKurus -
                fiyatHesapla("temel", 50).totalKurus,
            )}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {gapExpression(50, "monthly")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {extraUserCount(50)} ek kullanıcı. TEMEL → KOBİ ile KOBİ → PRO aynı
            tutarda ayrılır.
          </p>
        </article>
        <article className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
            100 kullanıcı · yıllık aralık
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight tabular-nums">
            {formatTry(yearly100[1].totalKurus - yearly100[0].totalKurus)}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {gapExpression(100, "yearly")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Yıllık avantaj {formatPercent(YEARLY_DISCOUNT_RATIO)}.{" "}
            {YEARLY_USAGE_MONTHS} ay kullanım, {YEARLY_PAID_MONTHS} ay ödeme.
          </p>
        </article>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="px-4 py-4 text-left text-sm text-muted-foreground">
            Kişi başı aylık ücret. 100 kişilik yıllık sütun, yıl boyunca kişi
            başına düşen tutardır.
          </caption>
          <thead>
            <tr className="border-y border-border text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              <th className="px-4 py-3 text-left font-medium">Paket</th>
              {seats.map((users) => (
                <th key={users} className="px-4 py-3 text-right font-medium">
                  {users} kişi / ay
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">100 kişi / yıl</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((plan) => (
              <tr key={plan.id} className="border-b border-border last:border-b-0">
                <th className={`px-4 py-3 text-left font-medium ${tone[plan.id]}`}>
                  {plan.name}
                </th>
                {seats.map((users) => {
                  const quote = fiyatHesapla(plan.id, users, "aylik");
                  const perUser = perUserAmount(quote.totalKurus, users);
                  return (
                    <td key={users} className="px-4 py-3 text-right tabular-nums">
                      {perUser.exact ? "" : "≈ "}
                      {formatTry(perUser.kurus)}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatTry(
                    perUserAmount(
                      fiyatHesapla(plan.id, 100, "yillik").totalKurus,
                      100,
                    ).kurus,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {yearly100.map((quote) => (
          <article
            key={quote.planId}
            className="rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10"
          >
            <p className={`text-sm font-semibold ${tone[quote.planId]}`}>
              {quote.planName} · 100 kişi yıllık
            </p>
            <p className="mt-2 text-sm text-muted-foreground tabular-nums">
              {formatTry(quote.twelveMonthListKurus)} liste
            </p>
            <p className="text-sm tabular-nums">{formatTry(quote.totalKurus)} ödeme</p>
            <p className="text-sm text-primary tabular-nums">
              {formatTry(quote.yearlySavingsKurus)} iki ayın karşılığı
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-border px-4 py-4 text-sm leading-6 text-muted-foreground">
        <p>
          20 ve altındaki her kadro aynı paketi öder. 21. kullanıcıda ek birim
          başlar: {edge.map((quote) => `${quote.planName} ${formatTry(quote.totalKurus)}`).join(" · ")}.
        </p>
        <p className="mt-2">
          Free, 5 kullanıcıda kalır ve ek koltuk alamaz. Bu fonksiyon ücretli
          üç paketi hesaplar.
        </p>
      </div>
    </section>
  );
}
