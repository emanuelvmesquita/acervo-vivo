import { createClient as createServerClient } from "@/lib/supabase/server";
import { notificarUsuario } from "@/lib/notificacoes";
import { NextResponse } from "next/server";

// POST /api/notificacoes/avisar — admin envia um aviso pontual a um usuário
// (usado ao confirmar/recusar solicitações de empréstimo)
export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("perfil").eq("id", user.id).single();
  if (profile?.perfil !== "administrador") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { usuarioId, mensagem, tipo } = await request.json();
  if (!usuarioId || !mensagem || !tipo) {
    return NextResponse.json({ error: "usuarioId, mensagem e tipo são obrigatórios." }, { status: 400 });
  }

  try {
    const resultado = await notificarUsuario(usuarioId, mensagem, tipo);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[notificacoes/avisar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
