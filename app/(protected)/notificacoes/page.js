import { createClient } from "@/lib/supabase/server";
import NotificacoesView from "@/components/NotificacoesView";

export const metadata = { title: "Notificações — Acervo Vivo" };

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("perfil, nome")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.perfil === "administrador";

  const query = supabase
    .from("notificacoes_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!isAdmin) {
    query.ilike("destinatario", `%${profile?.nome?.split(" ")[0] ?? ""}%`);
  }

  const { data: notifs } = await query;

  return <NotificacoesView notifsIniciais={notifs ?? []} isAdmin={isAdmin} />;
}
