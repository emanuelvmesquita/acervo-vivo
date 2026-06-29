import { createClient } from "@/lib/supabase/server";
import DesejosView from "@/components/DesejosView";

export const metadata = { title: "Lista de Desejos — Acervo Vivo" };

export default async function DesejosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: desejos } = await supabase
    .from("desejos")
    .select("*, livros(titulo, autor, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <DesejosView desejosIniciais={desejos ?? []} userId={user.id} />;
}
