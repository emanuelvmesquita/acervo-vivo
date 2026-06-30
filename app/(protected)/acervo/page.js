import { createClient } from "@/lib/supabase/server";
import AcervoView from "@/components/AcervoView";

export const metadata = { title: "Acervo — Acervo Vivo" };

export default async function AcervoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: titulos }, { data: exemplares }, { data: profile }] = await Promise.all([
    supabase.from("titulos").select("*").order("titulo"),
    supabase.from("exemplares").select("*").order("created_at"),
    supabase.from("profiles").select("perfil").eq("id", user.id).single(),
  ]);

  const isAdmin = profile?.perfil === "administrador";

  const [{ data: minhasSolicitacoes }, { data: minhaListaEspera }, { data: listaEsperaTodos }] = await Promise.all([
    supabase.from("solicitacoes_emprestimo").select("*").eq("usuario_id", user.id),
    supabase.from("lista_espera").select("*").eq("usuario_id", user.id),
    isAdmin
      ? supabase.from("lista_espera").select("*, profiles(nome)").order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <AcervoView
      titulosIniciais={titulos ?? []}
      exemplaresIniciais={exemplares ?? []}
      isAdmin={isAdmin}
      userId={user.id}
      minhasSolicitacoesIniciais={minhasSolicitacoes ?? []}
      minhaListaEsperaIniciais={minhaListaEspera ?? []}
      listaEsperaTodosIniciais={listaEsperaTodos ?? []}
    />
  );
}
