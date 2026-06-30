import { createClient } from "@/lib/supabase/server";
import AnotacoesView from "@/components/AnotacoesView";

export const metadata = { title: "Anotações — Acervo Vivo" };

export default async function AnotacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: anotacoes }, { data: titulos }] = await Promise.all([
    supabase
      .from("anotacoes")
      .select("*, titulos(titulo, autor)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("titulos")
      .select("id, titulo, autor")
      .order("titulo"),
  ]);

  return (
    <AnotacoesView
      anotacoesIniciais={anotacoes ?? []}
      titulos={titulos ?? []}
      userId={user.id}
    />
  );
}
