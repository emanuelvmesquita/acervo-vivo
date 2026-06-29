"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS, FONT } from "@/lib/design";

const supabase = createClient();

export default function ConfigView({ configInicial }) {
  const [config, setConfig] = useState(configInicial ?? {
    ativo: true,
    antecedencia_dias: 2,
    horario_envio: "08:00",
  });
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function set(k, v) {
    setConfig(c => ({ ...c, [k]: v }));
    setFeedback(null);
  }

  async function salvar() {
    setSalvando(true);
    setFeedback(null);
    const { error } = await supabase
      .from("config_notif")
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSalvando(false);
    if (error) {
      setFeedback({ tipo: "erro", msg: error.message });
    } else {
      setFeedback({ tipo: "ok", msg: "Configurações salvas com sucesso." });
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontFamily: FONT.serif, color: COLORS.text }}>Configurações</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textLight }}>Parâmetros do sistema de notificações</p>
      </div>

      <div style={{ maxWidth: 580 }}>
        {/* Notificações ativas */}
        <Secao titulo="Notificações de Vencimento">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: COLORS.text }}>Envio automático de alertas</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textLight }}>
                Notifica locatários sobre livros próximos ao vencimento ou atrasados
              </p>
            </div>
            <Toggle
              ativo={config.ativo}
              onChange={v => set("ativo", v)}
            />
          </div>

          <div style={{
            padding: "20px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, opacity: config.ativo ? 1 : 0.5,
            pointerEvents: config.ativo ? "auto" : "none",
          }}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Antecedência para alertar (dias antes do vencimento)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range" min={1} max={7} step={1}
                  value={config.antecedencia_dias}
                  onChange={e => set("antecedencia_dias", Number(e.target.value))}
                  style={{ flex: 1, accentColor: COLORS.primary }}
                />
                <span style={{
                  minWidth: 36, textAlign: "center", fontWeight: 700, fontSize: 18,
                  color: COLORS.primary, fontFamily: FONT.serif,
                }}>
                  {config.antecedencia_dias}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: COLORS.textLight }}>
                Alerta será enviado {config.antecedencia_dias} dia{config.antecedencia_dias !== 1 ? "s" : ""} antes do prazo de devolução
              </p>
            </div>

            <div>
              <label style={labelStyle}>Horário de envio das notificações</label>
              <input
                type="time"
                value={config.horario_envio}
                onChange={e => set("horario_envio", e.target.value)}
                style={{ ...inputStyle, maxWidth: 160 }}
              />
              <p style={{ margin: "6px 0 0", fontSize: 12, color: COLORS.textLight }}>
                Job agendado será executado neste horário (Brasília)
              </p>
            </div>
          </div>
        </Secao>

        {/* Canais — planejado */}
        <Secao titulo="Canais de Notificação">
          <div style={{
            padding: "20px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
          }}>
            <CanalRow
              icon="📱"
              nome="WhatsApp (Twilio)"
              descricao="Mensagens via API Twilio WhatsApp"
              badge="Em breve"
            />
            <CanalRow
              icon="✉️"
              nome="E-mail (Resend)"
              descricao="E-mails transacionais via Resend"
              badge="Em breve"
            />
            <CanalRow
              icon="💬"
              nome="SMS (Twilio)"
              descricao="SMS como fallback quando WhatsApp falhar"
              badge="Em breve"
            />
          </div>
        </Secao>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 20,
            background: feedback.tipo === "ok" ? COLORS.successLight : COLORS.dangerLight,
            border: `1px solid ${feedback.tipo === "ok" ? COLORS.success : COLORS.danger}`,
            color: feedback.tipo === "ok" ? COLORS.success : COLORS.danger,
            fontSize: 14, fontWeight: 500,
          }}>
            {feedback.msg}
          </div>
        )}

        <button onClick={salvar} disabled={salvando} style={btnPrimario}>
          {salvando ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: COLORS.textLight,
        textTransform: "uppercase", letterSpacing: "0.05em" }}>{titulo}</h2>
      {children}
    </div>
  );
}

function Toggle({ ativo, onChange }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      style={{
        width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
        background: ativo ? COLORS.primary : COLORS.border,
        position: "relative", flexShrink: 0, transition: "background 0.2s",
        padding: 0,
      }}
      aria-label={ativo ? "Desativar" : "Ativar"}
    >
      <span style={{
        position: "absolute", top: 3, left: ativo ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", display: "block",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function CanalRow({ icon, nome, descricao, badge }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
      borderBottom: `1px solid ${COLORS.border}`,
    }}
      className="canal-row"
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, color: COLORS.text, fontSize: 14 }}>{nome}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textLight }}>{descricao}</p>
      </div>
      {badge && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          background: COLORS.warnLight, color: COLORS.warn, whiteSpace: "nowrap",
        }}>
          {badge}
        </span>
      )}
      <style>{`.canal-row:last-child { border-bottom: none; }`}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`,
  borderRadius: 8, fontSize: 14, fontFamily: FONT.sans, boxSizing: "border-box",
  background: "#fff", color: COLORS.text, outline: "none",
};
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 };
const btnPrimario = {
  background: COLORS.primary, color: "#fff", border: "none",
  padding: "11px 24px", borderRadius: 8, cursor: "pointer",
  fontWeight: 600, fontSize: 14, fontFamily: FONT.sans,
};
