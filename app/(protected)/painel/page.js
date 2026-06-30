import { createClient } from "@/lib/supabase/server";
import PainelView from "@/components/PainelView";

export const metadata = { title: "Painel — Acervo Vivo" };

export default async function PainelPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("perfil, nome")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.perfil === "administrador";

  // Fetch data for the dashboard
  const [
    { data: titulos },
    { data: emprestimos },
    { data: renovacoes },
    { data: usuarios },
    { data: leituras },
  ] = await Promise.all([
    supabase.from("titulos").select("id, titulo, created_at"),
    supabase
      .from("emprestimos")
      .select("id, locatario, usuario_id, exemplar_id, data_emprestimo, data_devolucao, data_devolvido, data_devolucao_efetiva, status, exemplares(titulo_id, titulos(titulo, autor))")
      .order("data_emprestimo", { ascending: false }),
    supabase.from("renovacoes").select("id, locatario, titulo_id, status, data_solicitacao").eq("status", "Solicitada"),
    isAdmin ? supabase.from("profiles").select("id").eq("ativo", true) : Promise.resolve({ data: [] }),
    !isAdmin ? supabase.from("leituras").select("id, progresso, titulo_id, titulos(titulo, autor)").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);

  return (
    <PainelView
      profile={profile}
      isAdmin={isAdmin}
      userId={user.id}
      titulos={titulos ?? []}
      emprestimos={emprestimos ?? []}
      renovacoes={renovacoes ?? []}
      totalUsuarios={(usuarios ?? []).length}
      leituras={leituras ?? []}
    />
  );
}
