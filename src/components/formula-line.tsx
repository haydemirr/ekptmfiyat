import {
  formatAmount,
  formatTry,
  type Quote,
} from "@/lib/pricing";

export function FormulaLine({ quote }: { quote: Quote }) {
  const period = quote.billing === "monthly" ? "ay" : "yıl";
  const total = `${formatTry(quote.totalKurus)}/${period}`;

  if (quote.extraUsers === 0) {
    return (
      <span className="whitespace-nowrap">
        {formatAmount(quote.packageFeeKurus)} TL = {total}
      </span>
    );
  }

  const left = `${formatAmount(quote.packageFeeKurus)} + ((${quote.userCount} − 20) × ${formatAmount(quote.extraUnitKurus)})`;

  return (
    <>
      <span>{left}</span>{" "}
      <span className="whitespace-nowrap">= {total}</span>
    </>
  );
}
