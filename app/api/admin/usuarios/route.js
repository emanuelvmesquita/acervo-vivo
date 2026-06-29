import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// POST — criar novo usuário
export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("perfil").eq("id", user.id).single();
  if (profile?.perfil !== "administrador") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { nome, email, cpf, telefone, perfil } = await request.json();
  if (!nome || !email || !cpf) return NextResponse.json({ error: "Nome, e-mail e CPF são obrigatórios." }, { status: 400 });

  const admin = adminClient();

  // Criar usuário no Auth com senha temporária aleatória
  const senhaTemp = Math.random().toString(36).slice(2, 10) + "A1!";
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: senhaTemp,
    email_confirm: true,
    user_metadata: { nome, cpf, perfil: perfil ?? "leitor" },
  });

  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });

  // Atualizar perfil com os dados completos
  const { error: profErr } = await admin.from("profiles").update({
    nome, cpf, email, telefone: telefone ?? null,
    perfil: perfil ?? "leitor",
    pending_senha: true,
  }).eq("id", authUser.user.id);

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  const { data: novo } = await admin.from("profiles").select("*").eq("id", authUser.user.id).single();
  return NextResponse.json({ usuario: novo });
}

// PATCH — editar perfil
export async function PATCH(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: meProfile } = await supabase.from("profiles").select("perfil").eq("id", user.id).single();
  if (meProfile?.perfil !== "administrador") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id, nome, email, cpf, telefone, perfil, ativo } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const updates = {};
  if (nome !== undefined) updates.nome = nome;
  if (email !== undefined) updates.email = email;
  if (cpf !== undefined) updates.cpf = cpf;
  if (telefone !== undefined) updates.telefone = telefone;
  if (perfil !== undefined) updates.perfil = perfil;
  if (ativo !== undefined) updates.ativo = ativo;

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ usuario: data });
}

// DELETE — excluir usuário
export async function DELETE(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: meProfile } = await supabase.from("profiles").select("perfil").eq("id", user.id).single();
  if (meProfile?.perfil !== "administrador") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  if (id === user.id) return NextResponse.json({ error: "Não é possível excluir sua própria conta." }, { status: 400 });

  const admin = adminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
