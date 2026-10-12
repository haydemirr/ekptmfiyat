import { Analysis } from "@/components/analysis";
import { Calculator } from "@/components/calculator";
import { ScenarioPanel } from "@/components/scenario-panel";
import { SheetTable } from "@/components/sheet-table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PLANS,
  PRICE_RULE,
  YEARLY_RULE,
  fiyatHesapla,
  formatPercent,
  formulaExpression,
  verifyPublishedSheet,
  YEARLY_DISCOUNT_RATIO,
} from "@/lib/pricing";

export default function Home() {
  const monthly50 = PLANS.map((plan) => fiyatHesapla(plan.id, 50, "aylik"));
  const yearly100 = PLANS.map((plan) => fiyatHesapla(plan.id, 100, "yillik"));
  const checks = verifyPublishedSheet();
  const passed = checks.filter((check) => check.ok).length;
  const sheetOk = passed === checks.length;
  const proExample = fiyatHesapla("professional", 50, "aylik");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Yeni fiyatlandırma</Badge>
          <Badge variant="outline" data-testid="sheet-status">
            {sheetOk
              ? `${passed}/${checks.length} tablo ile aynı`
              : `${passed}/${checks.length} tutuyor`}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl tracking-tight text-balance sm:text-6xl">
            50 kullanıcı ayda, 100 kullanıcı yılda.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Starter artık TEMEL, Standard KOBİ, Professional PRO.
          </p>
          <p className="mt-3 max-w-3xl font-mono text-sm leading-6 text-foreground/90">
            {PRICE_RULE}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {YEARLY_RULE} Avantaj {formatPercent(YEARLY_DISCOUNT_RATIO)}.
          </p>
        </div>
        <a
          href="#hesap"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          Başka bir kadroyu hesapla
        </a>
      </header>

      <section
        aria-label="İstenen fiyatlar"
        className="grid gap-4 lg:grid-cols-2"
      >
        <ScenarioPanel
          kicker="Aylık"
          title="50 kullanıcı"
          description="Paket ücreti, 20 kişiyi kapsar. Kalan 30 kişi ek birimle çarpılır."
          quotes={monthly50}
        />
        <ScenarioPanel
          kicker="Yıllık · 2 ay ücretsiz"
          title="100 kullanıcı"
          description="Yıllık tutar, aynı kadronun aylık toplamının 10 katıdır."
          quotes={yearly100}
        />
      </section>

      <section className="rounded-2xl bg-card px-5 py-6 ring-1 ring-foreground/10 sm:px-7">
        <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
          Örnek — PRO, 50 kullanıcı
        </p>
        <p className="mt-3 font-mono text-lg leading-8 text-balance sm:text-2xl">
          {formulaExpression(proExample)}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          20 ve altında ücret paket tutarıdır. Yıllık abonelik, aylık toplamın
          10 katıdır; 12 ay kullanım 10 ay ödemeyle yürür.
        </p>
      </section>

      <Calculator />

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-3xl tracking-tight">
            Yayımlanan tablo
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {sheetOk
              ? "Hücreler fonksiyondan hesaplandı. 18 tutar ve 6 ek koltuk birimi fiyat kağıdıyla aynı."
              : `${passed} / ${checks.length} kontrol fiyat kağıdıyla aynı.`}
          </p>
        </div>
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="px-4 pt-4">
            <h3 className="text-sm font-medium">Aylık fiyatlar</h3>
          </div>
          <SheetTable billing="monthly" checks={checks} />
          <Separator />
          <div className="px-4 pt-4">
            <h3 className="text-sm font-medium">Yıllık fiyatlar (2 ay ücretsiz)</h3>
          </div>
          <SheetTable billing="yearly" checks={checks} />
        </div>
      </section>

      <Analysis />

      <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          Fonksiyon <span className="font-mono text-foreground">fiyatHesapla</span>{" "}
          · <span className="font-mono">src/lib/pricing.ts</span>
        </p>
        <p className="mt-1 font-mono text-xs">
          GET /api/quote?plan=pro&users=50&billing=aylik
        </p>
        <p className="mt-1 font-mono text-xs">GET /api/scenarios</p>
      </footer>
    </main>
  );
}
