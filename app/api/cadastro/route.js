import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const { nome, email, cpf, telefone, senha } = await request.json();

  if (!nome || !email || !cpf || !senha) {
    return NextResponse.json({ error: "Nome, e-mail, CPF e senha são obrigatórios." }, { status: 400 });
  }

  // Validação mínima de senha no servidor
  const senhaOk = senha.length >= 8
    && /[A-Z]/.test(senha)
    && /[a-z]/.test(senha)
    && /[0-9]/.test(senha)
    && /[^A-Za-z0-9]/.test(senha);

  if (!senhaOk) {
    return NextResponse.json({ error: "Senha não atende aos requisitos de segurança." }, { status: 400 });
  }

  const admin = adminClient();

  // Verificar se CPF já está cadastrado
  const { data: cpfExistente } = await admin
    .from("profiles")
    .select("id")
    .eq("cpf", cpf.replace(/\D/g, ""))
    .maybeSingle();

  if (cpfExistente) {
    return NextResponse.json({ error: "CPF já cadastrado." }, { status: 400 });
  }

  // Criar usuário no Auth
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (authErr) {
    if (authErr.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 400 });
    }
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  // Atualizar perfil com dados completos
  const { error: profErr } = await admin
    .from("profiles")
    .update({
      nome: nome.trim(),
      email,
      cpf: cpf.replace(/\D/g, ""),
      telefone: telefone ? telefone.replace(/\D/g, "") : null,
      perfil: "leitor",
      ativo: true,
      pending_senha: false,
    })
    .eq("id", authData.user.id);

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
