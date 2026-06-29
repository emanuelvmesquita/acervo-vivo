import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, cpf, perfil, foto, ativo")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.ativo) redirect("/login");

  return <AppShell user={user} profile={profile}>{children}</AppShell>;
}
