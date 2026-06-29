"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import { RefreshCw, Plus, Check, X, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

function fmtDate(iso) { return iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR") : "—"; }
function fmtDatetime(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }
function addDays(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

const STATUS_CFG = {
  Solicitada: { bg: COLORS.warnLight,    color: COLORS.warn,    icon: Clock         },
  Aprovada:   { bg: COLORS.successLight, color: COLORS.success, icon: CheckCircle2  },
  Negada:     { bg: COLORS.dangerLight,  color: COLORS.danger,  icon: XCircle       },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.Solicitada;
  const Icon = cfg.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      <Icon size={11} /> {status}
    </span>
  );
}

function Label({ children }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{children}</label>;
}

// Modal para solicitar renovação (leitor)
function SolicitarModal({ emprestimosAtivos, nomeLeitor, onSave, onClose, salvando }) {
  const [empId, setEmpId] = useState("");
  const [novaData, setNovaData] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const emp = emprestimosAtivos.find(e => e.id === empId);
  const minData = emp ? addDays(emp.data_devolucao, 1) : todayISO();

  function handleSelect(id) {
    setEmpId(id);
    const e = emprestimosAtivos.find(x => x.id === id);
    if (e) setNovaData(addDays(e.data_devolucao, 14));
  }

  const valido = empId && novaData && novaData > (emp?.data_devolucao ?? "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 480, padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>Solicitar renovação</h2>
          <button onClick={onClose} style={{ color: COLORS.textLight }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>Empréstimo *</Label>
          <select value={empId} onChange={e => handleSelect(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}>
            <option value="">Selecione um empréstimo ativo…</option>
            {emprestimosAtivos.map(e => (
              <option key={e.id} value={e.id}>{e.livros?.titulo} — vence {fmtDate(e.data_devolucao)}</option>
            ))}
          </select>
          {emprestimosAtivos.length === 0 && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>Você não tem empréstimos ativos no momento.</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>Nova data de devolução *</Label>
          <input type="date" value={novaData} min={minData} onChange={e => setNovaData(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          {emp && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>Data atual: {fmtDate(emp.data_devolucao)}</div>}
        </div>

        {/* Atalhos */}
        {emp && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[7, 14, 21].map(d => (
              <button key={d} onClick={() => setNovaData(addDays(emp.data_devolucao, d))}
                style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 12, border: `1px solid ${COLORS.border}`, color: COLORS.textLight }}>
                +{d}d
              </button>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <Label>Justificativa</Label>
          <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} rows={2} placeholder="Motivo da renovação (opcional)"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onSave({ emprestimo_id: empId, livro_id: emp?.livro_id, locatario: nomeLeitor, nova_data: novaData, justificativa })}
            disabled={!valido || salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: valido ? COLORS.primary : COLORS.border, color: valido ? "#fff" : COLORS.textLight }}>
            {salvando ? "Enviando…" : "Enviar solicitação"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para avaliar renovação (admin)
function AvaliarModal({ renovacao, onAprovar, onNegar, onClose, salvando }) {
  const [novaData, setNovaData] = useState(renovacao.nova_data ?? "");
  const [obs, setObs] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 460, padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>Avaliar renovação</h2>
          <button onClick={onClose} style={{ color: COLORS.textLight }}><X size={20} /></button>
        </div>

        <div style={{ background: COLORS.bg, borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{renovacao.emprestimos?.livros?.titulo}</div>
          <div style={{ color: COLORS.textLight }}>Locatário: {renovacao.locatario}</div>
          <div style={{ color: COLORS.textLight }}>Vencimento atual: {fmtDate(renovacao.emprestimos?.data_devolucao)}</div>
          <div style={{ color: COLORS.textLight }}>Nova data solicitada: {fmtDate(renovacao.nova_data)}</div>
          {renovacao.justificativa && <div style={{ marginTop: 6, color: COLORS.text }}>"{renovacao.justificativa}"</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>Nova data (pode ajustar)</Label>
          <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)}
            min={renovacao.emprestimos?.data_devolucao}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label>Observação ao leitor</Label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Opcional"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onNegar(obs)} disabled={salvando}
            style={{ padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.dangerLight, color: COLORS.danger }}>
            Negar
          </button>
          <button onClick={() => onAprovar(novaData, obs)} disabled={!novaData || salvando}
            style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.primary, color: "#fff" }}>
            {salvando ? "Salvando…" : "Aprovar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenovacaoCard({ r, isAdmin, onAvaliar }) {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${STATUS_CFG[r.status]?.color ?? COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{r.emprestimos?.livros?.titulo ?? "Livro removido"}</div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>{r.locatario} · solicitada em {fmtDatetime(r.data_solicitacao)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <StatusBadge status={r.status} />
          <button onClick={() => setExpandido(v => !v)} style={{ color: COLORS.textLight, padding: 2 }}>
            {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expandido && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 16px", background: COLORS.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, marginBottom: 12 }}>
            <div><span style={{ color: COLORS.textLight }}>Vencimento atual: </span>{fmtDate(r.emprestimos?.data_devolucao)}</div>
            <div><span style={{ color: COLORS.textLight }}>Nova data pedida: </span>{fmtDate(r.nova_data)}</div>
            {r.justificativa && <div style={{ gridColumn: "1/-1" }}><span style={{ color: COLORS.textLight }}>Justificativa: </span>"{r.justificativa}"</div>}
            {r.observacao_admin && <div style={{ gridColumn: "1/-1" }}><span style={{ color: COLORS.textLight }}>Obs. admin: </span>{r.observacao_admin}</div>}
          </div>
          {isAdmin && r.status === "Solicitada" && (
            <button onClick={() => onAvaliar(r)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              <Check size={14} /> Avaliar pedido
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RenovacoesView({ renovacoesIniciais, isAdmin, emprestimosAtivos, nomeLeitor }) {
  const [renovacoes, setRenovacoes] = useState(renovacoesIniciais);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [solicitarAberto, setSolicitarAberto] = useState(false);
  const [avaliando, setAvaliando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState("");

  const supabase = createClient();
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtradas = useMemo(() => renovacoes.filter(r =>
    filtroStatus === "Todos" || r.status === filtroStatus
  ), [renovacoes, filtroStatus]);

  const pendentes = renovacoes.filter(r => r.status === "Solicitada").length;

  async function solicitar(dados) {
    setSalvando(true);
    const { data, error } = await supabase
      .from("renovacoes")
      .insert({ ...dados, status: "Solicitada" })
      .select("*, emprestimos(id, data_devolucao, livros(titulo, autor))")
      .single();
    if (!error) {
      setRenovacoes(rs => [data, ...rs]);
      setSolicitarAberto(false);
      showToast("Solicitação enviada.");
    }
    setSalvando(false);
  }

  async function aprovar(novaData, obs) {
    if (!avaliando) return;
    setSalvando(true);
    const { data, error } = await supabase
      .from("renovacoes")
      .update({ status: "Aprovada", nova_data: novaData, observacao_admin: obs || null })
      .eq("id", avaliando.id)
      .select("*, emprestimos(id, data_devolucao, livros(titulo, autor))")
      .single();

    if (!error) {
      // Atualiza a data de devolução do empréstimo
      await supabase.from("emprestimos").update({ data_devolucao: novaData, status: "Ativo" }).eq("id", avaliando.emprestimo_id);
      setRenovacoes(rs => rs.map(r => r.id === avaliando.id ? data : r));
      setAvaliando(null);
      showToast("Renovação aprovada.");
    }
    setSalvando(false);
  }

  async function negar(obs) {
    if (!avaliando) return;
    setSalvando(true);
    const { data, error } = await supabase
      .from("renovacoes")
      .update({ status: "Negada", observacao_admin: obs || null })
      .eq("id", avaliando.id)
      .select("*, emprestimos(id, data_devolucao, livros(titulo, autor))")
      .single();

    if (!error) {
      setRenovacoes(rs => rs.map(r => r.id === avaliando.id ? data : r));
      setAvaliando(null);
      showToast("Renovação negada.");
    }
    setSalvando(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark }}>Renovações</h1>
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2 }}>
            {isAdmin
              ? pendentes > 0 ? `${pendentes} pedido${pendentes > 1 ? "s" : ""} aguardando avaliação` : "Nenhum pedido pendente"
              : `${renovacoes.length} solicitação${renovacoes.length !== 1 ? "ões" : ""}`}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={() => setSolicitarAberto(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> Solicitar renovação
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["Todos", "Solicitada", "Aprovada", "Negada"].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: `1.5px solid ${filtroStatus === s ? COLORS.primary : COLORS.border}`,
            background: filtroStatus === s ? COLORS.primary : "transparent",
            color: filtroStatus === s ? "#fff" : COLORS.text,
          }}>{s}</button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <RefreshCw size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: COLORS.textLight }}>
            {filtroStatus !== "Todos" ? `Nenhuma renovação ${filtroStatus.toLowerCase()}.` : "Nenhuma renovação registrada ainda."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtradas.map(r => (
            <RenovacaoCard key={r.id} r={r} isAdmin={isAdmin} onAvaliar={setAvaliando} />
          ))}
        </div>
      )}

      {solicitarAberto && (
        <SolicitarModal emprestimosAtivos={emprestimosAtivos} nomeLeitor={nomeLeitor} onSave={solicitar} onClose={() => setSolicitarAberto(false)} salvando={salvando} />
      )}
      {avaliando && (
        <AvaliarModal renovacao={avaliando} onAprovar={aprovar} onNegar={negar} onClose={() => setAvaliando(null)} salvando={salvando} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, background: COLORS.primaryDark, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
