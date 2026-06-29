import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConfigView from "@/components/ConfigView";

export const metadata = { title: "Configurações — Acervo Vivo" };

export default async function ConfigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("perfil")
    .eq("id", user.id)
    .single();

  if (profile?.perfil !== "administrador") redirect("/painel");

  const { data: config } = await supabase
    .from("config_notif")
    .select("*")
    .eq("id", 1)
    .single();

  return <ConfigView configInicial={config} />;
}
