import { createClient } from "@/lib/supabase/server";
import AcervoView from "@/components/AcervoView";

export const metadata = { title: "Acervo — Acervo Vivo" };

export default async function AcervoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: livros }, { data: profile }] = await Promise.all([
    supabase.from("livros").select("*").order("titulo"),
    supabase.from("profiles").select("perfil").eq("id", user.id).single(),
  ]);

  const isAdmin = profile?.perfil === "admin";

  return <AcervoView livrosIniciais={livros ?? []} isAdmin={isAdmin} />;
}
