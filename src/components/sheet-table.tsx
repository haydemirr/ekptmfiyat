import { PLANS, formatTry, type BillingPeriod, type SheetCheck } from "@/lib/pricing";

const seats = [20, 50, 100] as const;

const tone = {
  temel: "text-tier-temel",
  kobi: "text-tier-kobi",
  pro: "text-tier-pro",
} as const;

function findCheck(
  checks: SheetCheck[],
  planId: SheetCheck["planId"],
  billing: BillingPeriod,
  kind: SheetCheck["kind"],
  users: number | null,
): SheetCheck {
  const found = checks.find(
    (check) =>
      check.planId === planId &&
      check.billing === billing &&
      check.kind === kind &&
      check.users === users,
  );
  if (!found) {
    throw new Error("Tablo kontrolü eksik.");
  }
  return found;
}

function PriceCell({ check }: { check: SheetCheck }) {
  return (
    <td
      className={`px-3 py-3 text-right tabular-nums ${check.ok ? "" : "text-destructive"}`}
    >
      {formatTry(check.actualKurus)}
      {check.ok ? null : (
        <span className="mt-1 block text-[0.7rem]">
          tabloda {formatTry(check.expectedKurus)}
        </span>
      )}
    </td>
  );
}

export function SheetTable({
  billing,
  checks,
}: {
  billing: BillingPeriod;
  checks: SheetCheck[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          {billing === "monthly" ? "Aylık" : "Yıllık"} fiyatların fonksiyon
          çıktısı
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
            <th className="px-3 py-3 font-medium">Paket</th>
            <th className="px-3 py-3 text-right font-medium">20 kullanıcı</th>
            <th className="px-3 py-3 text-right font-medium">50 kullanıcı</th>
            <th className="px-3 py-3 text-right font-medium">100 kullanıcı</th>
            <th className="px-3 py-3 text-right font-medium">Ek koltuk</th>
          </tr>
        </thead>
        <tbody>
          {PLANS.map((plan) => (
            <tr key={plan.id} className="border-b border-border">
              <th className="px-3 py-3 text-left font-medium">
                <span className={tone[plan.id]}>{plan.name}</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {plan.formerName}
                </span>
              </th>
              {seats.map((users) => (
                <PriceCell
                  key={users}
                  check={findCheck(checks, plan.id, billing, "total", users)}
                />
              ))}
              <PriceCell
                check={findCheck(checks, plan.id, billing, "extra", null)}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
