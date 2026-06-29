import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsuariosView from "@/components/UsuariosView";

export const metadata = { title: "Usuários — Acervo Vivo" };

export default async function UsuariosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("perfil")
    .eq("id", user.id)
    .single();

  if (profile?.perfil !== "administrador") redirect("/painel");

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*")
    .order("nome");

  return <UsuariosView usuariosIniciais={usuarios ?? []} meId={user.id} />;
}
