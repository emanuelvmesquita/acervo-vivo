import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Mapeia status Twilio → status interno
const STATUS_MAP = {
  sent:        "enviado",
  delivered:   "entregue",
  read:        "lido",
  failed:      "falhou",
  undelivered: "falhou",
  canceled:    "falhou",
};

// POST /api/webhooks/twilio
// Twilio envia form-encoded; valida assinatura antes de processar.
export async function POST(request) {
  const authToken  = process.env.TWILIO_AUTH_TOKEN ?? "";
  const signature  = request.headers.get("x-twilio-signature") ?? "";
  // NEXT_PUBLIC_APP_URL (production) ou VERCEL_URL (preview) — VERCEL_URL não tem protocolo
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const url = `${baseUrl}/api/webhooks/twilio`;

  // Lê body como form-encoded
  const text   = await request.text();
  const params = Object.fromEntries(new URLSearchParams(text));

  // Valida assinatura Twilio (pula em ambiente local sem token)
  if (authToken) {
    const valid = twilio.validateRequest(authToken, signature, url, params);
    if (!valid) {
      console.warn("[webhook/twilio] assinatura inválida");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 403 });
    }
  }

  const sid           = params.MessageSid ?? params.SmsSid;
  const twilioStatus  = params.MessageStatus ?? params.SmsStatus;

  if (!sid || !twilioStatus) {
    return NextResponse.json({ ok: true }); // ping de teste do Twilio
  }

  const statusInterno = STATUS_MAP[twilioStatus] ?? twilioStatus;

  const supabase = adminClient();

  const { error } = await supabase
    .from("notificacoes_log")
    .update({ status_entrega: statusInterno })
    .eq("twilio_sid", sid);

  if (error) {
    console.error("[webhook/twilio] erro ao atualizar log:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[webhook/twilio] ${sid} → ${statusInterno}`);
  return NextResponse.json({ ok: true });
}
