"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import { Plus, Search, BookCopy, Check, X, AlertTriangle, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function diffDays(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
function fmtDate(iso) { return iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR") : "—"; }
function addDays(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const STATUS_COLOR = {
  Ativo:     { bg: COLORS.successLight, color: COLORS.success },
  Atrasado:  { bg: COLORS.dangerLight,  color: COLORS.danger  },
  Devolvido: { bg: COLORS.bg,           color: COLORS.textLight },
};

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] ?? STATUS_COLOR.Ativo;
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
}

function Label({ children }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{children}</label>;
}

function NovoEmprestimoForm({ livros, onSave, onClose, salvando }) {
  const today = todayISO();
  const [dados, setDados] = useState({
    livro_id: "", locatario: "",
    data_emprestimo: today,
    data_devolucao: addDays(today, 14),
    observacoes: "",
  });

  const livrosDisponiveis = livros.filter(l => l.status === "Disponível");
  const livroSel = livros.find(l => l.id === dados.livro_id);
  const valido = dados.livro_id && dados.locatario.trim() && dados.data_devolucao > dados.data_emprestimo;

  function set(k, v) { setDados(d => ({ ...d, [k]: v })); }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 520, padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>Novo empréstimo</h2>
          <button onClick={onClose} style={{ color: COLORS.textLight }}><X size={20} /></button>
        </div>

        {/* Livro */}
        <div style={{ marginBottom: 14 }}>
          <Label>Livro *</Label>
          <select
            value={dados.livro_id}
            onChange={e => set("livro_id", e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}
          >
            <option value="">Selecione um livro disponível…</option>
            {livrosDisponiveis.map(l => (
              <option key={l.id} value={l.id}>{l.titulo}{l.tombo ? ` (#${l.tombo})` : ""}</option>
            ))}
          </select>
          {livroSel && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>{livroSel.autor}</div>}
          {livrosDisponiveis.length === 0 && <div style={{ fontSize: 12, color: COLORS.warn, marginTop: 4 }}>Nenhum livro disponível no momento.</div>}
        </div>

        {/* Locatário */}
        <div style={{ marginBottom: 14 }}>
          <Label>Nome do locatário *</Label>
          <input
            value={dados.locatario}
            onChange={e => set("locatario", e.target.value)}
            placeholder="Nome completo"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}
          />
        </div>

        {/* Datas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <Label>Data do empréstimo *</Label>
            <input type="date" value={dados.data_emprestimo}
              onChange={e => set("data_emprestimo", e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          </div>
          <div>
            <Label>Devolução prevista *</Label>
            <input type="date" value={dados.data_devolucao}
              onChange={e => set("data_devolucao", e.target.value)}
              min={dados.data_emprestimo}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          </div>
        </div>

        {/* Prazo rápido */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[7, 14, 21, 30].map(d => (
            <button key={d} onClick={() => set("data_devolucao", addDays(dados.data_emprestimo, d))}
              style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 12, border: `1px solid ${COLORS.border}`, color: COLORS.textLight }}>
              {d}d
            </button>
          ))}
        </div>

        {/* Observações */}
        <div style={{ marginBottom: 20 }}>
          <Label>Observações</Label>
          <textarea value={dados.observacoes} onChange={e => set("observacoes", e.target.value)} rows={2}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onSave(dados)} disabled={!valido || salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: valido ? COLORS.primary : COLORS.border, color: valido ? "#fff" : COLORS.textLight }}>
            {salvando ? "Registrando…" : "Registrar empréstimo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DevolucaoModal({ emprestimo, onSave, onClose, salvando }) {
  const today = todayISO();
  const [obs, setObs] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 420, padding: "28px" }}>
        <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 8 }}>Registrar devolução</h2>
        <p style={{ fontSize: 14, color: COLORS.textLight, marginBottom: 20 }}>
          <strong style={{ color: COLORS.text }}>{emprestimo.livros?.titulo}</strong>
          {" — "}{emprestimo.locatario}
        </p>
        <div style={{ background: COLORS.bg, borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: COLORS.textLight }}>Prazo previsto</span>
            <span style={{ fontWeight: 600 }}>{fmtDate(emprestimo.data_devolucao)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: COLORS.textLight }}>Data de hoje</span>
            <span style={{ fontWeight: 600, color: today > emprestimo.data_devolucao ? COLORS.danger : COLORS.success }}>{fmtDate(today)}</span>
          </div>
          {today > emprestimo.data_devolucao && (
            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.danger }}>
              <AlertTriangle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {diffDays(emprestimo.data_devolucao, today)} dia(s) de atraso
            </div>
          )}
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Observações</Label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onSave(obs)} disabled={salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.primary, color: "#fff" }}>
            {salvando ? "Salvando…" : "Confirmar devolução"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmprestimoCard({ emp, onDevolver }) {
  const today = todayISO();
  const [expandido, setExpandido] = useState(false);
  const dias = emp.status !== "Devolvido" ? diffDays(today, emp.data_devolucao) : null;
  const corBorda = emp.status === "Devolvido" ? COLORS.border : emp.status === "Atrasado" ? COLORS.danger : dias <= 2 ? COLORS.warn : COLORS.success;

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${corBorda}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp.livros?.titulo ?? "Livro removido"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>{emp.locatario}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <StatusBadge status={emp.status} />
          <button onClick={() => setExpandido(v => !v)} style={{ color: COLORS.textLight, padding: 2 }}>
            {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px 14px", display: "flex", gap: 20, fontSize: 12, color: COLORS.textLight }}>
        <span><Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />{fmtDate(emp.data_emprestimo)}</span>
        {emp.status !== "Devolvido"
          ? <span style={{ color: dias < 0 ? COLORS.danger : dias <= 2 ? COLORS.warn : "inherit" }}>
              {dias < 0 ? `Atrasado ${Math.abs(dias)}d` : dias === 0 ? "Vence hoje" : `Vence em ${dias}d — ${fmtDate(emp.data_devolucao)}`}
            </span>
          : <span><CheckCircle2 size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Devolvido em {fmtDate(emp.data_devolucao_efetiva ?? emp.data_devolvido?.slice(0,10))}</span>
        }
      </div>

      {expandido && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 16px", background: COLORS.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, marginBottom: 12 }}>
            <div><span style={{ color: COLORS.textLight }}>Autor: </span>{emp.livros?.autor ?? "—"}</div>
            <div><span style={{ color: COLORS.textLight }}>Empréstimo: </span>{fmtDate(emp.data_emprestimo)}</div>
            <div><span style={{ color: COLORS.textLight }}>Devolução prev.: </span>{fmtDate(emp.data_devolucao)}</div>
            {emp.observacoes && <div style={{ gridColumn: "1/-1" }}><span style={{ color: COLORS.textLight }}>Obs.: </span>{emp.observacoes}</div>}
          </div>
          {emp.status !== "Devolvido" && (
            <button onClick={() => onDevolver(emp)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              <Check size={14} /> Registrar devolução
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmprestimosView({ emprestimosIniciais, livros }) {
  const [emprestimos, setEmprestimos] = useState(() =>
    emprestimosIniciais.map(e => {
      if (e.status !== "Devolvido" && e.data_devolucao < todayISO()) return { ...e, status: "Atrasado" };
      return e;
    })
  );
  const [livrosState, setLivrosState] = useState(livros);
  const [novoAberto, setNovoAberto] = useState(false);
  const [devolucao, setDevolucao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [toast, setToast] = useState("");

  const supabase = createClient();

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtrados = useMemo(() => emprestimos.filter(e => {
    const q = busca.toLowerCase();
    const matchBusca = !q || e.locatario?.toLowerCase().includes(q) || e.livros?.titulo?.toLowerCase().includes(q);
    const matchStatus = filtroStatus === "Todos" || e.status === filtroStatus;
    return matchBusca && matchStatus;
  }), [emprestimos, busca, filtroStatus]);

  const contadores = useMemo(() => ({
    ativos: emprestimos.filter(e => e.status === "Ativo").length,
    atrasados: emprestimos.filter(e => e.status === "Atrasado").length,
    devolvidos: emprestimos.filter(e => e.status === "Devolvido").length,
  }), [emprestimos]);

  async function registrarEmprestimo(dados) {
    setSalvando(true);
    const { data, error } = await supabase
      .from("emprestimos")
      .insert({ ...dados, status: "Ativo" })
      .select("*, livros(titulo, autor)")
      .single();

    if (!error) {
      await supabase.from("livros").update({ status: "Emprestado" }).eq("id", dados.livro_id);
      setEmprestimos(es => [data, ...es]);
      setLivrosState(ls => ls.map(l => l.id === dados.livro_id ? { ...l, status: "Emprestado" } : l));
      setNovoAberto(false);
      showToast("Empréstimo registrado.");
    }
    setSalvando(false);
  }

  async function confirmarDevolucao(obs) {
    if (!devolucao) return;
    setSalvando(true);
    const today = todayISO();
    const { data, error } = await supabase
      .from("emprestimos")
      .update({
        status: "Devolvido",
        data_devolvido: new Date().toISOString(),
        data_devolucao_efetiva: today,
        observacoes: obs || devolucao.observacoes,
      })
      .eq("id", devolucao.id)
      .select("*, livros(titulo, autor)")
      .single();

    if (!error) {
      await supabase.from("livros").update({ status: "Disponível" }).eq("id", devolucao.livro_id);
      setEmprestimos(es => es.map(e => e.id === devolucao.id ? data : e));
      setLivrosState(ls => ls.map(l => l.id === devolucao.livro_id ? { ...l, status: "Disponível" } : l));
      setDevolucao(null);
      showToast("Devolução registrada.");
    }
    setSalvando(false);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark }}>Empréstimos</h1>
          <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 13 }}>
            <span style={{ color: COLORS.success }}>{contadores.ativos} ativo{contadores.ativos !== 1 ? "s" : ""}</span>
            {contadores.atrasados > 0 && <span style={{ color: COLORS.danger }}>{contadores.atrasados} atrasado{contadores.atrasados !== 1 ? "s" : ""}</span>}
            <span style={{ color: COLORS.textLight }}>{contadores.devolvidos} devolvido{contadores.devolvidos !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <button onClick={() => setNovoAberto(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Novo empréstimo
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textLight }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por locatário ou título…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bgCard, outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Ativo", "Atrasado", "Devolvido"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${filtroStatus === s ? COLORS.primary : COLORS.border}`,
              background: filtroStatus === s ? COLORS.primary : "transparent",
              color: filtroStatus === s ? "#fff" : COLORS.text,
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <BookCopy size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: COLORS.textLight }}>
            {busca || filtroStatus !== "Todos" ? "Nenhum empréstimo encontrado." : "Nenhum empréstimo registrado ainda."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrados.map(e => (
            <EmprestimoCard key={e.id} emp={e} onDevolver={setDevolucao} />
          ))}
        </div>
      )}

      {novoAberto && (
        <NovoEmprestimoForm livros={livrosState} onSave={registrarEmprestimo} onClose={() => setNovoAberto(false)} salvando={salvando} />
      )}
      {devolucao && (
        <DevolucaoModal emprestimo={devolucao} onSave={confirmarDevolucao} onClose={() => setDevolucao(null)} salvando={salvando} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, background: COLORS.primaryDark, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
