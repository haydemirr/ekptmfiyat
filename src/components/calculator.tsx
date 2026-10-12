"use client";

import { useMemo, useState } from "react";

import { FormulaLine } from "@/components/formula-line";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  INCLUDED_USERS,
  PLANS,
  PRICE_RULE,
  PricingError,
  extraUserCount,
  fiyatHesapla,
  formatTry,
  gapExpression,
  parseUserCount,
  tierStep,
  type PlanId,
} from "@/lib/pricing";

const presets = [20, 35, 50, 100];

const tone: Record<PlanId, { text: string; dot: string }> = {
  temel: { text: "text-tier-temel", dot: "bg-tier-temel" },
  kobi: { text: "text-tier-kobi", dot: "bg-tier-kobi" },
  pro: { text: "text-tier-pro", dot: "bg-tier-pro" },
};

export function Calculator() {
  const [raw, setRaw] = useState("35");

  const parsed = useMemo(() => {
    if (raw.trim() === "") return { status: "empty" as const };
    try {
      const users = parseUserCount(raw);
      return {
        status: "ok" as const,
        users,
        monthly: PLANS.map((plan) => fiyatHesapla(plan.id, users, "aylik")),
        yearly: PLANS.map((plan) => fiyatHesapla(plan.id, users, "yillik")),
      };
    } catch (error) {
      const message =
        error instanceof PricingError ? error.message : "Hesaplanamadı.";
      return { status: "error" as const, message };
    }
  }, [raw]);

  const activeUsers = parsed.status === "ok" ? parsed.users : null;
  const step = tierStep();

  return (
    <section id="hesap" className="scroll-mt-8">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="font-display text-3xl tracking-tight">Başka bir kadro</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {PRICE_RULE} Tablodaki 20, 50 ve 100 kadroları da, aradaki kadrolar da
          aynı fonksiyondan çıkar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı sayısı</CardTitle>
          <CardDescription>
            {INCLUDED_USERS} kullanıcı paket ücretine dahil. Üstündeki her kişi
            ek birimle çarpılır.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="user-count">
              Kullanıcı sayısı
            </label>
            <Input
              id="user-count"
              inputMode="numeric"
              autoComplete="off"
              value={raw}
              aria-invalid={parsed.status === "error"}
              onChange={(event) => setRaw(event.target.value)}
              className="h-12 max-w-xs px-3 font-display text-2xl tabular-nums"
            />
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={activeUsers === preset ? "default" : "outline"}
                  onClick={() => setRaw(String(preset))}
                >
                  {preset === 35 ? "35 · tabloda yok" : String(preset)}
                </Button>
              ))}
            </div>
          </div>

          {parsed.status === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {parsed.message} Geçerli bir kadro girilince ücretler görünür.
            </p>
          ) : null}

          {parsed.status === "empty" ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Kadro boş. Kullanıcı sayısını yazınca üç paketin aylık ve yıllık
              ücreti burada çıkar.
            </div>
          ) : null}

          {parsed.status === "ok" ? (
            <>
              <p className="text-sm text-muted-foreground">
                {parsed.users <= INCLUDED_USERS
                  ? "Bu kadro 20 kullanıcının içinde. Ek tutar 0 TL."
                  : parsed.users === INCLUDED_USERS + 1
                    ? "Ek koltuk ilk kez bu kullanıcıda başlar. Ek kullanıcı 1."
                    : [20, 50, 100].includes(parsed.users)
                      ? `Ek kullanıcı ${extraUserCount(parsed.users)}. Bu kadro yayımlanan tabloda da duruyor.`
                      : `Ek kullanıcı ${extraUserCount(parsed.users)}. Ücret doğrudan fonksiyondan çıkıyor.`}
              </p>
              <div className="grid gap-3 lg:grid-cols-3">
                {parsed.monthly.map((monthly, index) => {
                  const yearly = parsed.yearly[index];
                  return (
                    <article
                      key={monthly.planId}
                      className="rounded-xl bg-background/50 p-4 ring-1 ring-foreground/10"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${tone[monthly.planId].dot}`}
                        />
                        <h3
                          className={`text-sm font-semibold ${tone[monthly.planId].text}`}
                        >
                          {monthly.planName}
                        </h3>
                        <Badge variant="outline">{monthly.formerName}</Badge>
                      </div>
                      <p className="mt-4 text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
                        Aylık
                      </p>
                      <p className="font-display text-3xl tracking-tight tabular-nums">
                        {formatTry(monthly.totalKurus)}
                      </p>
                      <p className="mt-1 font-mono text-[0.72rem] leading-5 text-muted-foreground">
                        <FormulaLine quote={monthly} />
                      </p>
                      <p className="mt-4 text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
                        Yıllık
                      </p>
                      <p className="font-display text-2xl tracking-tight tabular-nums">
                        {formatTry(yearly.totalKurus)}
                      </p>
                      <p className="mt-1 font-mono text-[0.72rem] leading-5 text-muted-foreground">
                        <FormulaLine quote={yearly} />
                      </p>
                      <p className="mt-2 text-xs text-primary tabular-nums">
                        {formatTry(yearly.yearlySavingsKurus)} avantaj
                      </p>
                    </article>
                  );
                })}
              </div>
              {step.even ? (
                <div className="grid gap-1 text-sm text-muted-foreground tabular-nums sm:grid-cols-2">
                  <p>Aylık komşu farkı {gapExpression(parsed.users, "monthly")}.</p>
                  <p>Yıllık komşu farkı {gapExpression(parsed.users, "yearly")}.</p>
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
