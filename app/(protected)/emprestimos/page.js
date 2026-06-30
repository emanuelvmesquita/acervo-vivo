import { createClient } from "@/lib/supabase/server";
import EmprestimosView from "@/components/EmprestimosView";

export const metadata = { title: "Empréstimos — Acervo Vivo" };

export default async function EmprestimosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("perfil").eq("id", user.id).single();
  const isAdmin = profile?.perfil === "administrador";

  const [{ data: emprestimos }, { data: exemplares }, { data: profiles }, { data: solicitacoesPendentes }] = await Promise.all([
    supabase
      .from("emprestimos")
      .select("*, exemplares(tombo, titulos(titulo, autor))")
      .order("data_emprestimo", { ascending: false }),
    supabase
      .from("exemplares")
      .select("*, titulos(titulo, autor)")
      .order("created_at"),
    isAdmin
      ? supabase.from("profiles").select("id, nome, cpf, telefone, email, ativo").order("nome")
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from("solicitacoes_emprestimo")
          .select("*, titulos(titulo, autor), profiles(nome, cpf, telefone)")
          .eq("status", "Pendente")
          .order("data_solicitacao")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <EmprestimosView
      emprestimosIniciais={emprestimos ?? []}
      exemplaresIniciais={exemplares ?? []}
      isAdmin={isAdmin}
      profiles={profiles ?? []}
      solicitacoesPendentesIniciais={solicitacoesPendentes ?? []}
    />
  );
}
