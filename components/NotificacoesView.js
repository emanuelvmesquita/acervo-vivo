"use client";
import { useState, useMemo } from "react";
import { COLORS, FONT } from "@/lib/design";

function fmtDateTime(s) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS = {
  enviado: { bg: COLORS.successLight, color: COLORS.success },
  falhou: { bg: COLORS.dangerLight, color: COLORS.danger },
  pendente: { bg: COLORS.warnLight, color: COLORS.warn },
};

export default function NotificacoesView({ notifsIniciais, isAdmin }) {
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroCanal, setFiltroCanal] = useState("Todos");
  const [busca, setBusca] = useState([]);

  const canais = useMemo(() => {
    const set = new Set(notifsIniciais.map(n => n.canal).filter(Boolean));
    return ["Todos", ...set];
  }, [notifsIniciais]);

  const lista = useMemo(() => {
    let l = notifsIniciais;
    if (filtroStatus !== "Todos") l = l.filter(n => n.status_entrega === filtroStatus.toLowerCase());
    if (filtroCanal !== "Todos") l = l.filter(n => n.canal === filtroCanal);
    return l;
  }, [notifsIniciais, filtroStatus, filtroCanal]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontFamily: FONT.serif, color: COLORS.text }}>Notificações</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textLight }}>
          {isAdmin ? "Histórico completo de mensagens enviadas pelo sistema" : "Mensagens recebidas sobre seus empréstimos"}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Enviado", "Falhou", "Pendente"].map(f => (
            <button key={f} onClick={() => setFiltroStatus(f)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.border}`,
                cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONT.sans,
                background: filtroStatus === f ? COLORS.primary : COLORS.bg,
                color: filtroStatus === f ? "#fff" : COLORS.text,
                borderColor: filtroStatus === f ? COLORS.primary : COLORS.border,
              }}>
              {f}
            </button>
          ))}
        </div>
        {isAdmin && canais.length > 1 && (
          <select value={filtroCanal} onChange={e => setFiltroCanal(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
              fontSize: 13, fontFamily: FONT.sans, background: "#fff" }}>
            {canais.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      {lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: COLORS.text }}>Nenhuma notificação ainda</p>
          <p style={{ margin: 0, fontSize: 14 }}>
            {isAdmin
              ? "As mensagens enviadas pelo sistema aparecerão aqui."
              : "Você receberá alertas sobre seus empréstimos próximos do vencimento."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Header */}
          {isAdmin && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 100px 120px",
              gap: 12, padding: "8px 16px", fontSize: 11, fontWeight: 700,
              color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Mensagem</span>
              <span>Destinatário</span>
              <span>Canal</span>
              <span>Status</span>
              <span>Data</span>
            </div>
          )}
          {lista.map(n => (
            <NotifRow key={n.id} notif={n} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotifRow({ notif, isAdmin }) {
  const [expandido, setExpandido] = useState(false);
  const sc = STATUS_COLORS[notif.status_entrega] ?? STATUS_COLORS.enviado;

  if (!isAdmin) {
    return (
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10,
        padding: "14px 18px", marginBottom: 8, borderLeft: `4px solid ${sc.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.text, lineHeight: 1.5 }}>{notif.texto}</p>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
            background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
            {notif.status_entrega}
          </span>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: COLORS.textLight }}>
          {notif.canal} · {fmtDateTime(notif.created_at)}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}` }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 100px 120px",
          gap: 12, padding: "12px 16px", cursor: "pointer", alignItems: "center" }}
        onClick={() => setExpandido(e => !e)}
      >
        <p style={{ margin: 0, fontSize: 13, color: COLORS.text,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {notif.texto}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textLight,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {notif.destinatario}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textLight }}>{notif.canal}</p>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          background: sc.bg, color: sc.color, whiteSpace: "nowrap", display: "inline-block" }}>
          {notif.status_entrega}
        </span>
        <p style={{ margin: 0, fontSize: 12, color: COLORS.textLight }}>{fmtDateTime(notif.created_at)}</p>
      </div>
      {expandido && (
        <div style={{ padding: "12px 16px 16px", background: "#FAFAF8", borderTop: `1px solid ${COLORS.border}` }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: COLORS.text }}>{notif.texto}</p>
          {notif.twilio_sid && (
            <p style={{ margin: 0, fontSize: 12, color: COLORS.textLight }}>SID: {notif.twilio_sid}</p>
          )}
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.textLight }}>Tipo: {notif.tipo}</p>
        </div>
      )}
    </div>
  );
}
