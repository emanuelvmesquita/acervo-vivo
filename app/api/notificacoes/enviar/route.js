import { createClient as createServerClient } from "@/lib/supabase/server";
import { processarNotificacoes } from "@/lib/notificacoes";
import { NextResponse } from "next/server";

// POST /api/notificacoes/enviar
// Aceita: admin autenticado via sessão  OU  header Authorization: Bearer CRON_SECRET
export async function POST(request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  // Autenticação por CRON_SECRET (uso interno / cron)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return executar();
  }

  // Autenticação por sessão (admin no painel)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("perfil").eq("id", user.id).single();
  if (profile?.perfil !== "administrador") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return executar();
}

async function executar() {
  try {
    const resultado = await processarNotificacoes();
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[notificacoes/enviar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
