import { createClient } from "@/lib/supabase/server";
import MinhaBibliotecaView from "@/components/MinhaBibliotecaView";

export const metadata = { title: "Minha Biblioteca — Acervo Vivo" };

export default async function MinhaBibliotecaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: livros }, { data: emprestimos }] = await Promise.all([
    supabase
      .from("minha_biblioteca_livros")
      .select("*")
      .eq("user_id", user.id)
      .order("titulo"),
    supabase
      .from("minha_biblioteca_emprestimos")
      .select("*, minha_biblioteca_livros(titulo, autor)")
      .eq("user_id", user.id)
      .order("data_emprestimo", { ascending: false }),
  ]);

  return (
    <MinhaBibliotecaView
      livrosIniciais={livros ?? []}
      emprestimosIniciais={emprestimos ?? []}
      userId={user.id}
    />
  );
}
