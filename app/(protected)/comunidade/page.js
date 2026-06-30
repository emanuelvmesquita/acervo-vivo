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

  const [{ data: grupos }, { data: posts }, { data: sugestoes }, { data: votos }] = await Promise.all([
    supabase.from("grupos").select("*").order("nome"),
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("sugestoes").select("*, profiles(nome)").order("created_at", { ascending: false }),
    supabase.from("sugestoes_votos").select("sugestao_id, usuario_id"),
  ]);

  return (
    <ComunidadeView
      gruposIniciais={grupos ?? []}
      postsIniciais={posts ?? []}
      sugestoesIniciais={sugestoes ?? []}
      votosIniciais={votos ?? []}
      nomeAutor={profile?.nome ?? "Usuário"}
      userId={user.id}
      isAdmin={profile?.perfil === "administrador"}
    />
  );
}
