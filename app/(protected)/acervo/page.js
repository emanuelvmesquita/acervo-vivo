import { createClient } from "@/lib/supabase/server";
import AcervoView from "@/components/AcervoView";

export const metadata = { title: "Acervo — Acervo Vivo" };

export default async function AcervoPage() {
  const supabase = await createClient();
  const { data: livros } = await supabase
    .from("livros")
    .select("*")
    .order("titulo");

  return <AcervoView livrosIniciais={livros ?? []} />;
}
