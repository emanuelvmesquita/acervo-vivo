import { createClient } from "@/lib/supabase/server";
import RenovacoesView from "@/components/RenovacoesView";

export const metadata = { title: "Renovações — Acervo Vivo" };

export default async function RenovacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("perfil, nome")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.perfil === "administrador";

  // Admin vê todas; leitor vê só as suas (por nome)
  const query = supabase
    .from("renovacoes")
    .select("*, emprestimos(id, data_devolucao, livros(titulo, autor))")
    .order("data_solicitacao", { ascending: false });

  if (!isAdmin) query.eq("locatario", profile?.nome ?? "");

  const { data: renovacoes } = await query;

  // Empréstimos ativos do leitor para solicitar renovação
  let emprestimosAtivos = [];
  if (!isAdmin) {
    const { data } = await supabase
      .from("emprestimos")
      .select("id, locatario, data_devolucao, livros(titulo)")
      .eq("status", "Ativo")
      .ilike("locatario", `%${profile?.nome?.split(" ")[0] ?? ""}%`);
    emprestimosAtivos = data ?? [];
  }

  return (
    <RenovacoesView
      renovacoesIniciais={renovacoes ?? []}
      isAdmin={isAdmin}
      emprestimosAtivos={emprestimosAtivos}
      nomeLeitor={profile?.nome ?? ""}
    />
  );
}
