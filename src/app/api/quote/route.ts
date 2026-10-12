import { NextRequest } from "next/server";

import { fiyatHesapla, PricingError, quotePayload } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const plan = params.get("plan")?.trim() ?? "";
  const usersRaw = params.get("users")?.trim() ?? "";
  const billing = params.get("billing")?.trim() || "aylik";

  if (!plan || !usersRaw) {
    return Response.json(
      { error: "plan ve users gerekli." },
      { status: 400 },
    );
  }

  if (!/^\d+$/.test(usersRaw)) {
    return Response.json(
      { error: "users tam sayı olmalı." },
      { status: 400 },
    );
  }

  try {
    const quote = fiyatHesapla(plan, Number(usersRaw), billing);
    return Response.json(quotePayload(quote));
  } catch (error) {
    if (error instanceof PricingError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
