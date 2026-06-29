import { processarNotificacoes } from "@/lib/notificacoes";
import { NextResponse } from "next/server";

// GET /api/cron/notificacoes
// Invocado pelo Vercel Cron (vercel.json) com header Authorization: Bearer CRON_SECRET
export async function GET(request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const resultado = await processarNotificacoes();
    console.log("[cron/notificacoes]", resultado);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[cron/notificacoes] erro:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
