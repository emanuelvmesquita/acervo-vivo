import { createClient } from "@/lib/supabase/server";
import AnotacoesView from "@/components/AnotacoesView";

export const metadata = { title: "Anotações — Acervo Vivo" };

export default async function AnotacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: anotacoes }, { data: livros }] = await Promise.all([
    supabase
      .from("anotacoes")
      .select("*, livros(titulo, autor)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("livros")
      .select("id, titulo, autor")
      .order("titulo"),
  ]);

  return (
    <AnotacoesView
      anotacoesIniciais={anotacoes ?? []}
      livros={livros ?? []}
      userId={user.id}
    />
  );
}
