import { createClient } from "@/lib/supabase/server";
import EmprestimosView from "@/components/EmprestimosView";

export const metadata = { title: "Empréstimos — Acervo Vivo" };

export default async function EmprestimosPage() {
  const supabase = await createClient();

  const [{ data: emprestimos }, { data: livros }] = await Promise.all([
    supabase
      .from("emprestimos")
      .select("*, livros(titulo, autor)")
      .order("data_emprestimo", { ascending: false }),
    supabase
      .from("livros")
      .select("id, titulo, autor, tombo, status")
      .order("titulo"),
  ]);

  return (
    <EmprestimosView
      emprestimosIniciais={emprestimos ?? []}
      livros={livros ?? []}
    />
  );
}
