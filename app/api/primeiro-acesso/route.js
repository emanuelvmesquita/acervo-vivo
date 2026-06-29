import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { token, senha } = await request.json();

  if (!token || !senha) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Service-role client — never exposed to the browser
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Find the profile with this token
  const { data: profile, error: findErr } = await adminClient
    .from("profiles")
    .select("id, email, pending_senha, token_senha")
    .eq("token_senha", token)
    .eq("pending_senha", true)
    .single();

  if (findErr || !profile) {
    return NextResponse.json({ error: "Link inválido ou já utilizado." }, { status: 404 });
  }

  // Update password in auth.users
  const { error: updateErr } = await adminClient.auth.admin.updateUserById(profile.id, {
    password: senha,
  });

  if (updateErr) {
    return NextResponse.json({ error: "Erro ao atualizar senha." }, { status: 500 });
  }

  // Clear the pending flag and token
  await adminClient
    .from("profiles")
    .update({ pending_senha: false, token_senha: null })
    .eq("id", profile.id);

  return NextResponse.json({ ok: true });
}
