import twilio from "twilio";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function fmtData(s) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function normalizarTelefone(tel) {
  const digits = tel.replace(/\D/g, "").replace(/^0/, "");
  // Se já tem DDI 55, usa direto; caso contrário adiciona
  const numero = digits.startsWith("55") ? digits : `55${digits}`;
  return `whatsapp:+${numero}`;
}

function emailHtml(texto, nomeLeitor) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#2D6A4F;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.5px">📚 Acervo Vivo</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 16px;color:#2C3E50;font-size:15px;line-height:1.7">${texto}</p>
      <hr style="border:none;border-top:1px solid #E0D9D0;margin:24px 0">
      <p style="margin:0;color:#7F8C8D;font-size:12px">Este é um aviso automático do sistema Acervo Vivo. Não responda este e-mail.</p>
    </div>
  </div>
</body>
</html>`;
}

async function enviarWhatsApp(telefone, mensagem) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const msg = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: normalizarTelefone(telefone),
    body: mensagem,
  });
  return { sid: msg.sid };
}

async function enviarEmail(email, nome, mensagem) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Acervo Vivo <avisos@acervovivo.com.br>",
    to: email,
    subject: "Lembrete de devolução — Acervo Vivo",
    html: emailHtml(mensagem, nome),
  });
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function processarNotificacoes() {
  const supabase = adminClient();

  // Buscar configuração
  const { data: config } = await supabase
    .from("config_notif").select("*").eq("id", 1).single();

  if (!config?.ativo) {
    return { enviadas: 0, puladas: 0, erros: [], msg: "Notificações desativadas nas configurações." };
  }

  const hoje = new Date().toISOString().split("T")[0];
  const limite = new Date();
  limite.setDate(limite.getDate() + config.antecedencia_dias);
  const dataLimite = limite.toISOString().split("T")[0];

  // Marcar como Atrasado os empréstimos vencidos ainda com status Ativo
  await supabase
    .from("emprestimos")
    .update({ status: "Atrasado" })
    .eq("status", "Ativo")
    .lt("data_devolucao", hoje);

  // Buscar empréstimos que precisam de notificação:
  // - Ativo com vencimento próximo (dentro da antecedência)
  // - Atrasado (já passou do prazo — lembrete diário)
  const { data: emprestimos, error: empErr } = await supabase
    .from("emprestimos")
    .select("id, locatario, data_devolucao, status, livros(titulo)")
    .in("status", ["Ativo", "Atrasado"])
    .lte("data_devolucao", dataLimite);

  if (empErr) return { enviadas: 0, puladas: 0, erros: [empErr.message] };
  if (!emprestimos?.length) return { enviadas: 0, puladas: 0, erros: [], msg: "Nenhum empréstimo para notificar hoje." };

  // Checar quais já foram notificados hoje (evitar duplicatas)
  const tiposHoje = emprestimos.map(e => `vencimento_${e.id}`);
  const { data: jaEnviados } = await supabase
    .from("notificacoes_log")
    .select("tipo")
    .in("tipo", tiposHoje)
    .gte("created_at", `${hoje}T00:00:00Z`);

  const jaEnviadosSet = new Set((jaEnviados ?? []).map(l => l.tipo));

  let enviadas = 0;
  let puladas = 0;
  const erros = [];

  for (const emp of emprestimos) {
    const tipo = `vencimento_${emp.id}`;

    if (jaEnviadosSet.has(tipo)) {
      puladas++;
      continue;
    }

    // Buscar perfil do locatário pelo primeiro nome
    const primeiroNome = emp.locatario.trim().split(" ")[0];
    const { data: perfis } = await supabase
      .from("profiles")
      .select("nome, telefone, email")
      .ilike("nome", `${primeiroNome}%`)
      .eq("ativo", true)
      .limit(1);

    const perfil = perfis?.[0];

    const dias = Math.ceil((new Date(emp.data_devolucao + "T23:59:59") - new Date()) / 86400000);
    const atrasado = dias < 0;
    const tituloLivro = emp.livros?.titulo ?? "livro";

    const mensagem = atrasado
      ? `Olá, ${emp.locatario}! O livro "${tituloLivro}" do Acervo Vivo está ${Math.abs(dias)} dia(s) em atraso. Por favor, devolva o quanto antes. Obrigado!`
      : `Olá, ${emp.locatario}! Lembrete: o livro "${tituloLivro}" precisa ser devolvido em ${dias} dia(s) (prazo: ${fmtData(emp.data_devolucao)}). Acervo Vivo.`;

    let canal = "WhatsApp Business";
    let statusEntrega = "enviado";
    let twilioSid = null;
    let erroMsg = null;

    try {
      if (perfil?.telefone) {
        const r = await enviarWhatsApp(perfil.telefone, mensagem);
        twilioSid = r.sid;
        canal = "WhatsApp Business";
      } else if (perfil?.email) {
        await enviarEmail(perfil.email, perfil.nome, mensagem);
        canal = "Email (Resend)";
      } else {
        statusEntrega = "pendente";
        canal = "sem_canal";
        erroMsg = "Locatário sem telefone ou e-mail cadastrado.";
      }
    } catch (err) {
      statusEntrega = "falhou";
      erroMsg = err.message;
      erros.push({ locatario: emp.locatario, erro: err.message });

      // Tenta fallback por e-mail se WhatsApp falhou
      if (canal === "WhatsApp Business" && perfil?.email) {
        try {
          await enviarEmail(perfil.email, perfil.nome, mensagem);
          canal = "Email (Resend) [fallback]";
          statusEntrega = "enviado";
          erros.pop();
        } catch (e2) {
          erros[erros.length - 1].fallbackErro = e2.message;
        }
      }
    }

    await supabase.from("notificacoes_log").insert({
      tipo,
      destinatario: emp.locatario,
      texto: mensagem,
      canal,
      twilio_sid: twilioSid,
      status_entrega: statusEntrega,
    });

    if (statusEntrega === "enviado") enviadas++;
  }

  return { enviadas, puladas, erros };
}
