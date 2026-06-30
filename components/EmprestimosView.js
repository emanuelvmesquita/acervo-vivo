"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import {
  Plus, Search, BookCopy, Check, X, AlertTriangle, Clock, CheckCircle2,
  ChevronDown, ChevronUp, UserSearch, UserPlus, Inbox,
} from "lucide-react";

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

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function BuscaUsuario({ profiles, selecionado, onSelecionar, onLimpar, onAbrirCadastro }) {
  const [busca, setBusca] = useState("");

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    const digitos = q.replace(/\D/g, "");
    return profiles
      .filter(p => p.nome?.toLowerCase().includes(q) || (digitos && p.cpf?.includes(digitos)))
      .slice(0, 6);
  }, [busca, profiles]);

  if (selecionado) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.primary}`, background: COLORS.bg }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{selecionado.nome}</div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>{selecionado.cpf ? `CPF ${selecionado.cpf}` : selecionado.email}</div>
        </div>
        <button onClick={onLimpar} style={{ fontSize: 12, color: COLORS.danger, background: "none", border: "none", cursor: "pointer" }}>Trocar</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        <UserSearch size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textLight }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar leitor por nome ou CPF…"
          style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", boxSizing: "border-box" }}
        />
      </div>
      {busca.trim() && (
        <div style={{ marginTop: 6, border: `1.5px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
          {resultados.length === 0 ? (
            <div style={{ padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: 13, color: COLORS.textLight, marginBottom: 8 }}>Nenhum usuário encontrado.</p>
              <button onClick={() => onAbrirCadastro(busca)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: COLORS.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <UserPlus size={14} /> Cadastrar novo usuário
              </button>
            </div>
          ) : (
            resultados.map(p => (
              <button key={p.id} onClick={() => onSelecionar(p)} style={{
                width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none",
                borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>{p.cpf ? `CPF ${p.cpf}` : p.email}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CadastroUsuarioInline({ valorInicial, onCriar, onCancelar, criando }) {
  const [dados, setDados] = useState({ nome: valorInicial ?? "", cpf: "", email: "", telefone: "" });
  function set(k, v) { setDados(d => ({ ...d, [k]: v })); }
  const valido = dados.nome.trim() && dados.email.trim() && dados.cpf.replace(/\D/g, "").length === 11;

  return (
    <div style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 10, padding: 16, background: COLORS.bg }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Cadastrar novo usuário</p>
      <Field label="Nome completo *" value={dados.nome} onChange={v => set("nome", v)} placeholder="Nome Sobrenome" />
      <Field label="CPF *" value={dados.cpf} onChange={v => set("cpf", v.replace(/\D/g, "").slice(0, 11))} placeholder="00000000000" />
      <Field label="E-mail *" type="email" value={dados.email} onChange={v => set("email", v)} placeholder="email@exemplo.com" />
      <Field label="Telefone" value={dados.telefone} onChange={v => set("telefone", v)} placeholder="(00) 00000-0000" />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancelar} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
        <button onClick={() => onCriar(dados)} disabled={!valido || criando}
          style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: valido ? COLORS.primary : COLORS.border, color: valido ? "#fff" : COLORS.textLight }}>
          {criando ? "Cadastrando…" : "Cadastrar e selecionar"}
        </button>
      </div>
    </div>
  );
}

function NovoEmprestimoForm({ exemplares, profiles, onSave, onClose, salvando, onCriarUsuario }) {
  const today = todayISO();
  const [exemplarId, setExemplarId] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [cadastroValorInicial, setCadastroValorInicial] = useState("");
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [dataEmprestimo, setDataEmprestimo] = useState(today);
  const [dataDevolucao, setDataDevolucao] = useState(addDays(today, 14));
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");

  const exemplaresDisponiveis = exemplares.filter(e => e.status === "Disponível");
  const exemplarSel = exemplares.find(e => e.id === exemplarId);
  const valido = exemplarId && usuario && dataDevolucao > dataEmprestimo;

  async function criarUsuario(dados) {
    setCriandoUsuario(true);
    setErro("");
    try {
      const novo = await onCriarUsuario(dados);
      setUsuario(novo);
      setCadastroAberto(false);
    } catch (err) {
      setErro(err.message);
    }
    setCriandoUsuario(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 520, padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>Novo empréstimo</h2>
          <button onClick={onClose} style={{ color: COLORS.textLight }}><X size={20} /></button>
        </div>

        {/* Exemplar */}
        <div style={{ marginBottom: 14 }}>
          <Label>Exemplar *</Label>
          <select
            value={exemplarId}
            onChange={e => setExemplarId(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}
          >
            <option value="">Selecione um exemplar disponível…</option>
            {exemplaresDisponiveis.map(e => (
              <option key={e.id} value={e.id}>{e.titulos?.titulo}{e.tombo ? ` (#${e.tombo})` : ""}</option>
            ))}
          </select>
          {exemplarSel && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>{exemplarSel.titulos?.autor}</div>}
          {exemplaresDisponiveis.length === 0 && <div style={{ fontSize: 12, color: COLORS.warn, marginTop: 4 }}>Nenhum exemplar disponível no momento.</div>}
        </div>

        {/* Leitor */}
        <div style={{ marginBottom: 14 }}>
          <Label>Leitor *</Label>
          {cadastroAberto ? (
            <CadastroUsuarioInline
              valorInicial={cadastroValorInicial}
              onCriar={criarUsuario}
              onCancelar={() => setCadastroAberto(false)}
              criando={criandoUsuario}
            />
          ) : (
            <BuscaUsuario
              profiles={profiles}
              selecionado={usuario}
              onSelecionar={setUsuario}
              onLimpar={() => setUsuario(null)}
              onAbrirCadastro={valor => { setCadastroValorInicial(valor); setCadastroAberto(true); }}
            />
          )}
          {erro && <p style={{ fontSize: 12, color: COLORS.danger, marginTop: 6 }}>{erro}</p>}
        </div>

        {/* Datas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <Label>Data do empréstimo *</Label>
            <input type="date" value={dataEmprestimo}
              onChange={e => setDataEmprestimo(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          </div>
          <div>
            <Label>Devolução prevista *</Label>
            <input type="date" value={dataDevolucao}
              onChange={e => setDataDevolucao(e.target.value)}
              min={dataEmprestimo}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          </div>
        </div>

        {/* Prazo rápido */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[7, 14, 21, 30].map(d => (
            <button key={d} onClick={() => setDataDevolucao(addDays(dataEmprestimo, d))}
              style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 12, border: `1px solid ${COLORS.border}`, color: COLORS.textLight }}>
              {d}d
            </button>
          ))}
        </div>

        {/* Observações */}
        <div style={{ marginBottom: 20 }}>
          <Label>Observações</Label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button
            onClick={() => onSave({ exemplar_id: exemplarId, usuario_id: usuario.id, locatario: usuario.nome, data_emprestimo: dataEmprestimo, data_devolucao: dataDevolucao, observacoes })}
            disabled={!valido || salvando}
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
          <strong style={{ color: COLORS.text }}>{emprestimo.exemplares?.titulos?.titulo}</strong>
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

function ConfirmarSolicitacaoModal({ solicitacao, exemplares, onSave, onClose, salvando }) {
  const today = todayISO();
  const exemplaresDoTitulo = exemplares.filter(e => e.titulo_id === solicitacao.titulo_id && e.status === "Disponível");
  const [exemplarId, setExemplarId] = useState(exemplaresDoTitulo[0]?.id ?? "");
  const [dataEmprestimo, setDataEmprestimo] = useState(today);
  const [dataDevolucao, setDataDevolucao] = useState(solicitacao.data_desejada && solicitacao.data_desejada > today ? solicitacao.data_desejada : addDays(today, 14));

  const valido = exemplarId && dataDevolucao > dataEmprestimo;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 460, padding: "28px" }}>
        <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 8 }}>Confirmar solicitação</h2>
        <p style={{ fontSize: 14, color: COLORS.textLight, marginBottom: 18 }}>
          <strong style={{ color: COLORS.text }}>{solicitacao.titulos?.titulo}</strong> — {solicitacao.profiles?.nome}
        </p>

        <div style={{ marginBottom: 14 }}>
          <Label>Exemplar *</Label>
          <select value={exemplarId} onChange={e => setExemplarId(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}>
            <option value="">Selecione…</option>
            {exemplaresDoTitulo.map(e => (
              <option key={e.id} value={e.id}>{e.tombo ? `#${e.tombo}` : e.id.slice(0, 8)}</option>
            ))}
          </select>
          {exemplaresDoTitulo.length === 0 && <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>Nenhum exemplar disponível para este título.</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <Label>Data do empréstimo *</Label>
            <input type="date" value={dataEmprestimo} onChange={e => setDataEmprestimo(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          </div>
          <div>
            <Label>Devolução prevista *</Label>
            <input type="date" value={dataDevolucao} onChange={e => setDataDevolucao(e.target.value)} min={dataEmprestimo}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onSave({ exemplar_id: exemplarId, data_emprestimo: dataEmprestimo, data_devolucao: dataDevolucao })} disabled={!valido || salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: valido ? COLORS.primary : COLORS.border, color: valido ? "#fff" : COLORS.textLight }}>
            {salvando ? "Confirmando…" : "Confirmar empréstimo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecusarSolicitacaoModal({ solicitacao, onSave, onClose, salvando }) {
  const [justificativa, setJustificativa] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 420, padding: "28px" }}>
        <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 8 }}>Recusar solicitação</h2>
        <p style={{ fontSize: 14, color: COLORS.textLight, marginBottom: 18 }}>
          <strong style={{ color: COLORS.text }}>{solicitacao.titulos?.titulo}</strong> — {solicitacao.profiles?.nome}
        </p>
        <div style={{ marginBottom: 20 }}>
          <Label>Justificativa</Label>
          <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} rows={3}
            placeholder="Explique o motivo da recusa…"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onSave(justificativa)} disabled={salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.danger, color: "#fff" }}>
            {salvando ? "Recusando…" : "Recusar solicitação"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmprestimoCard({ emp, onDevolver, isAdmin }) {
  const today = todayISO();
  const [expandido, setExpandido] = useState(false);
  const dias = emp.status !== "Devolvido" ? diffDays(today, emp.data_devolucao) : null;
  const corBorda = emp.status === "Devolvido" ? COLORS.border : emp.status === "Atrasado" ? COLORS.danger : dias <= 2 ? COLORS.warn : COLORS.success;

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${corBorda}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp.exemplares?.titulos?.titulo ?? "Título removido"}
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
            <div><span style={{ color: COLORS.textLight }}>Autor: </span>{emp.exemplares?.titulos?.autor ?? "—"}</div>
            <div><span style={{ color: COLORS.textLight }}>Exemplar: </span>{emp.exemplares?.tombo ? `#${emp.exemplares.tombo}` : "—"}</div>
            <div><span style={{ color: COLORS.textLight }}>Empréstimo: </span>{fmtDate(emp.data_emprestimo)}</div>
            <div><span style={{ color: COLORS.textLight }}>Devolução prev.: </span>{fmtDate(emp.data_devolucao)}</div>
            {emp.observacoes && <div style={{ gridColumn: "1/-1" }}><span style={{ color: COLORS.textLight }}>Obs.: </span>{emp.observacoes}</div>}
          </div>
          {isAdmin && emp.status !== "Devolvido" && (
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

function SolicitacaoCard({ solicitacao, onConfirmar, onRecusar }) {
  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{solicitacao.titulos?.titulo ?? "Título removido"}</div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>{solicitacao.profiles?.nome}{solicitacao.profiles?.cpf ? ` · CPF ${solicitacao.profiles.cpf}` : ""}</div>
        </div>
        <span style={{ fontSize: 11, color: COLORS.textLight, whiteSpace: "nowrap" }}>{fmtDate(solicitacao.data_solicitacao?.slice(0, 10))}</span>
      </div>
      {solicitacao.data_desejada && (
        <p style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 10 }}>Devolução desejada: {fmtDate(solicitacao.data_desejada)}</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onConfirmar(solicitacao)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          <Check size={13} /> Confirmar
        </button>
        <button onClick={() => onRecusar(solicitacao)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "none", color: COLORS.danger, border: `1.5px solid ${COLORS.dangerLight}`, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          <X size={13} /> Recusar
        </button>
      </div>
    </div>
  );
}

export default function EmprestimosView({ emprestimosIniciais, exemplaresIniciais, isAdmin = false, profiles = [], solicitacoesPendentesIniciais = [] }) {
  const [emprestimos, setEmprestimos] = useState(() =>
    emprestimosIniciais.map(e => {
      if (e.status !== "Devolvido" && e.data_devolucao < todayISO()) return { ...e, status: "Atrasado" };
      return e;
    })
  );
  const [exemplares, setExemplares] = useState(exemplaresIniciais);
  const [profilesState, setProfilesState] = useState(profiles);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(solicitacoesPendentesIniciais);

  const [aba, setAba] = useState("emprestimos");
  const [novoAberto, setNovoAberto] = useState(false);
  const [devolucao, setDevolucao] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [recusando, setRecusando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [toast, setToast] = useState("");

  const supabase = createClient();

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function avisar(usuarioId, mensagem, tipo) {
    try {
      await fetch("/api/notificacoes/avisar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, mensagem, tipo }),
      });
    } catch {
      // Falha no aviso não deve bloquear o fluxo principal.
    }
  }

  const filtrados = useMemo(() => emprestimos.filter(e => {
    const q = busca.toLowerCase();
    const matchBusca = !q || e.locatario?.toLowerCase().includes(q) || e.exemplares?.titulos?.titulo?.toLowerCase().includes(q);
    const matchStatus = filtroStatus === "Todos" || e.status === filtroStatus;
    return matchBusca && matchStatus;
  }), [emprestimos, busca, filtroStatus]);

  const contadores = useMemo(() => ({
    ativos: emprestimos.filter(e => e.status === "Ativo").length,
    atrasados: emprestimos.filter(e => e.status === "Atrasado").length,
    devolvidos: emprestimos.filter(e => e.status === "Devolvido").length,
  }), [emprestimos]);

  async function criarUsuario(dados) {
    const res = await fetch("/api/admin/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Erro ao cadastrar usuário.");
    setProfilesState(ps => [...ps, json.usuario].sort((a, b) => a.nome.localeCompare(b.nome)));
    return json.usuario;
  }

  async function registrarEmprestimo(dados) {
    setSalvando(true);
    const { data, error } = await supabase
      .from("emprestimos")
      .insert({
        exemplar_id: dados.exemplar_id, usuario_id: dados.usuario_id, locatario: dados.locatario,
        data_emprestimo: dados.data_emprestimo, data_devolucao: dados.data_devolucao,
        observacoes: dados.observacoes, status: "Ativo",
      })
      .select("*, exemplares(tombo, titulos(titulo, autor))")
      .single();

    if (!error) {
      await supabase.from("exemplares").update({ status: "Emprestado" }).eq("id", dados.exemplar_id);
      setEmprestimos(es => [data, ...es]);
      setExemplares(es => es.map(e => e.id === dados.exemplar_id ? { ...e, status: "Emprestado" } : e));
      setNovoAberto(false);
      showToast("Empréstimo registrado.");
    } else {
      showToast("Erro: " + error.message);
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
      .select("*, exemplares(tombo, titulos(titulo, autor))")
      .single();

    if (!error) {
      await supabase.from("exemplares").update({ status: "Disponível" }).eq("id", devolucao.exemplar_id);
      setEmprestimos(es => es.map(e => e.id === devolucao.id ? data : e));
      setExemplares(es => es.map(e => e.id === devolucao.exemplar_id ? { ...e, status: "Disponível" } : e));
      setDevolucao(null);
      showToast("Devolução registrada.");
    }
    setSalvando(false);
  }

  async function confirmarSolicitacao({ exemplar_id, data_emprestimo, data_devolucao }) {
    if (!confirmando) return;
    setSalvando(true);
    const { data, error } = await supabase
      .from("emprestimos")
      .insert({
        exemplar_id, usuario_id: confirmando.usuario_id, locatario: confirmando.profiles?.nome,
        data_emprestimo, data_devolucao, status: "Ativo",
      })
      .select("*, exemplares(tombo, titulos(titulo, autor))")
      .single();

    if (!error) {
      await supabase.from("exemplares").update({ status: "Emprestado" }).eq("id", exemplar_id);
      await supabase.from("solicitacoes_emprestimo").update({ status: "Confirmada", exemplar_id }).eq("id", confirmando.id);
      setEmprestimos(es => [data, ...es]);
      setExemplares(es => es.map(e => e.id === exemplar_id ? { ...e, status: "Emprestado" } : e));
      setSolicitacoesPendentes(ss => ss.filter(s => s.id !== confirmando.id));
      avisar(confirmando.usuario_id, `Seu empréstimo de "${confirmando.titulos?.titulo}" foi confirmado. Devolução prevista: ${fmtDate(data_devolucao)}.`, `solicitacao_confirmada_${confirmando.id}`);
      showToast("Solicitação confirmada.");
      setConfirmando(null);
    } else {
      showToast("Erro: " + error.message);
    }
    setSalvando(false);
  }

  async function recusarSolicitacao(justificativa) {
    if (!recusando) return;
    setSalvando(true);
    const { error } = await supabase
      .from("solicitacoes_emprestimo")
      .update({ status: "Recusada", justificativa_recusa: justificativa || null })
      .eq("id", recusando.id);

    if (!error) {
      setSolicitacoesPendentes(ss => ss.filter(s => s.id !== recusando.id));
      avisar(recusando.usuario_id, `Sua solicitação de empréstimo de "${recusando.titulos?.titulo}" foi recusada.${justificativa ? ` Motivo: ${justificativa}` : ""}`, `solicitacao_recusada_${recusando.id}`);
      showToast("Solicitação recusada.");
      setRecusando(null);
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
        {isAdmin && (
          <button onClick={() => setNovoAberto(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> Novo empréstimo
          </button>
        )}
      </div>

      {/* Abas */}
      {isAdmin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1.5px solid ${COLORS.border}` }}>
          {[{ v: "emprestimos", label: "Empréstimos" }, { v: "solicitacoes", label: `Solicitações pendentes${solicitacoesPendentes.length ? ` (${solicitacoesPendentes.length})` : ""}` }].map(({ v, label }) => (
            <button key={v} onClick={() => setAba(v)} style={{
              padding: "10px 4px", marginBottom: -2, fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer",
              color: aba === v ? COLORS.primaryDark : COLORS.textLight,
              borderBottom: aba === v ? `2.5px solid ${COLORS.primary}` : "2.5px solid transparent",
            }}>{label}</button>
          ))}
        </div>
      )}

      {aba === "solicitacoes" ? (
        solicitacoesPendentes.length === 0 ? (
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <Inbox size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: COLORS.textLight }}>Nenhuma solicitação pendente.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {solicitacoesPendentes.map(s => (
              <SolicitacaoCard key={s.id} solicitacao={s} onConfirmar={setConfirmando} onRecusar={setRecusando} />
            ))}
          </div>
        )
      ) : (
        <>
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
                <EmprestimoCard key={e.id} emp={e} onDevolver={setDevolucao} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </>
      )}

      {novoAberto && (
        <NovoEmprestimoForm exemplares={exemplares} profiles={profilesState} onSave={registrarEmprestimo} onClose={() => setNovoAberto(false)} salvando={salvando} onCriarUsuario={criarUsuario} />
      )}
      {devolucao && (
        <DevolucaoModal emprestimo={devolucao} onSave={confirmarDevolucao} onClose={() => setDevolucao(null)} salvando={salvando} />
      )}
      {confirmando && (
        <ConfirmarSolicitacaoModal solicitacao={confirmando} exemplares={exemplares} onSave={confirmarSolicitacao} onClose={() => setConfirmando(null)} salvando={salvando} />
      )}
      {recusando && (
        <RecusarSolicitacaoModal solicitacao={recusando} onSave={recusarSolicitacao} onClose={() => setRecusando(null)} salvando={salvando} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, background: COLORS.primaryDark, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
