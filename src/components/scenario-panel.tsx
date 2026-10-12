import { FormulaLine } from "@/components/formula-line";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatAmount,
  formatTry,
  perUserAmount,
  YEARLY_PAID_MONTHS,
  type Quote,
} from "@/lib/pricing";

const tone = {
  temel: "text-tier-temel",
  kobi: "text-tier-kobi",
  pro: "text-tier-pro",
} as const;

export function ScenarioPanel({
  kicker,
  title,
  description,
  quotes,
}: {
  kicker: string;
  title: string;
  description: string;
  quotes: Quote[];
}) {
  return (
    <Card className="bg-card/90">
      <CardHeader>
        <CardDescription className="text-[0.68rem] tracking-[0.18em] uppercase">
          {kicker}
        </CardDescription>
        <CardTitle className="font-display text-3xl tracking-tight">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-col">
        {quotes.map((quote) => {
          const perUser = perUserAmount(quote.totalKurus, quote.userCount);
          return (
            <article
              key={quote.planId}
              className="border-t border-border py-4 first:border-t-0 first:pt-0"
              data-testid={`${quote.billing}-${quote.userCount}-${quote.planId}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-sm font-semibold ${tone[quote.planId]}`}>
                    {quote.planName}
                  </h3>
                  <Badge variant="outline">eski adı {quote.formerName}</Badge>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl tracking-tight whitespace-nowrap tabular-nums">
                    {formatTry(quote.totalKurus)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {perUser.exact ? "Kişi başı" : "Kişi başı yaklaşık"}{" "}
                    {formatTry(perUser.kurus)}
                  </p>
                  {quote.billing === "yearly" ? (
                    <p className="mt-1 text-xs text-primary tabular-nums">
                      {formatTry(quote.yearlySavingsKurus)} avantaj
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 font-mono text-[0.78rem] leading-5 text-muted-foreground">
                <FormulaLine quote={quote} />
              </p>
              {quote.billing === "yearly" ? (
                <p className="mt-1 font-mono text-[0.78rem] text-muted-foreground">
                  Aylık {formatAmount(quote.monthlyTotalKurus)} × {YEARLY_PAID_MONTHS}
                </p>
              ) : null}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
