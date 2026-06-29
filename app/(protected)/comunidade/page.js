import { createClient } from "@/lib/supabase/server";
import ComunidadeView from "@/components/ComunidadeView";

export const metadata = { title: "Comunidade — Acervo Vivo" };

export default async function ComunidadePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, perfil")
    .eq("id", user.id)
    .single();

  const [{ data: grupos }, { data: posts }] = await Promise.all([
    supabase.from("grupos").select("*").order("nome"),
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <ComunidadeView
      gruposIniciais={grupos ?? []}
      postsIniciais={posts ?? []}
      nomeAutor={profile?.nome ?? "Usuário"}
      isAdmin={profile?.perfil === "administrador"}
    />
  );
}
