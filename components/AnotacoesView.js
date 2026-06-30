"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS, FONT } from "@/lib/design";

const supabase = createClient();

function fmtData(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("pt-BR");
}

function AnotacaoModal({ anotacao, titulos, userId, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: anotacao?.titulo ?? "",
    texto: anotacao?.texto ?? "",
    titulo_id: anotacao?.titulo_id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.texto.trim()) { setErro("O texto da anotação é obrigatório."); return; }
    setLoading(true);
    setErro("");
    const payload = {
      titulo: form.titulo || null,
      texto: form.texto,
      titulo_id: form.titulo_id || null,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    let data, error;
    if (anotacao?.id) {
      ({ data, error } = await supabase
        .from("anotacoes").update(payload).eq("id", anotacao.id).select("*, titulos(titulo, autor)").single());
    } else {
      ({ data, error } = await supabase
        .from("anotacoes").insert(payload).select("*, titulos(titulo, autor)").single());
    }
    setLoading(false);
    if (error) { setErro(error.message); return; }
    onSave(data, !!anotacao?.id);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ background: COLORS.bgCard, borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: FONT.serif }}>
            {anotacao?.id ? "Editar Anotação" : "Nova Anotação"}
          </h2>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Título (opcional)</label>
            <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
              placeholder="Ex: Passagem marcante" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Livro relacionado (opcional)</label>
            <select value={form.titulo_id} onChange={e => set("titulo_id", e.target.value)} style={inputStyle}>
              <option value="">— Nenhum —</option>
              {titulos.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Anotação *</label>
            <textarea value={form.texto} onChange={e => set("texto", e.target.value)}
              rows={6} placeholder="Escreva sua anotação, citação ou reflexão…"
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          {erro && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 12 }}>{erro}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecundario}>Cancelar</button>
            <button onClick={salvar} disabled={loading} style={btnPrimario}>
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnotacoesView({ anotacoesIniciais, titulos, userId }) {
  const [anotacoes, setAnotacoes] = useState(anotacoesIniciais);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroLivro, setFiltroLivro] = useState("");

  function onSave(anot, isEdit) {
    if (isEdit) setAnotacoes(as => as.map(a => a.id === anot.id ? anot : a));
    else setAnotacoes(as => [anot, ...as]);
    setModal(null);
  }

  async function excluir(id) {
    await supabase.from("anotacoes").delete().eq("id", id);
    setAnotacoes(as => as.filter(a => a.id !== id));
    setConfirmDelete(null);
  }

  const livrosComAnotacoes = useMemo(() => {
    const ids = new Set(anotacoes.map(a => a.titulo_id).filter(Boolean));
    return [{ id: "", titulo: "Todas" }, ...titulos.filter(t => ids.has(t.id))];
  }, [anotacoes, titulos]);

  const lista = useMemo(() => {
    let l = anotacoes;
    if (filtroLivro) l = l.filter(a => a.titulo_id === filtroLivro);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      l = l.filter(a =>
        a.titulo?.toLowerCase().includes(q) ||
        a.texto.toLowerCase().includes(q) ||
        a.titulos?.titulo?.toLowerCase().includes(q)
      );
    }
    return l;
  }, [anotacoes, filtroLivro, busca]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: FONT.serif, color: COLORS.text }}>Anotações</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textLight }}>
            Suas notas, citações e reflexões sobre leituras
          </p>
        </div>
        <button onClick={() => setModal("nova")} style={btnPrimario}>+ Nova Anotação</button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar nas anotações…" style={{ ...inputStyle, maxWidth: 280 }} />
        {livrosComAnotacoes.length > 1 && (
          <select value={filtroLivro} onChange={e => setFiltroLivro(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
            {livrosComAnotacoes.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
          </select>
        )}
      </div>

      {lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: COLORS.text }}>Nenhuma anotação ainda</p>
          <p style={{ margin: 0, fontSize: 14 }}>Registre citações, reflexões e notas sobre suas leituras.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {lista.map(a => (
            <AnotacaoCard key={a.id} anotacao={a}
              onEdit={() => setModal(a)}
              onDelete={() => setConfirmDelete(a)}
            />
          ))}
        </div>
      )}

      {modal && (
        <AnotacaoModal
          anotacao={modal === "nova" ? null : modal}
          titulos={titulos}
          userId={userId}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDelete && (
        <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
          <div style={{ background: COLORS.bgCard, borderRadius: 16, maxWidth: 400, width: "100%",
            padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontFamily: FONT.serif }}>Excluir anotação?</h3>
            <p style={{ color: COLORS.textLight, marginBottom: 20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btnSecundario}>Cancelar</button>
              <button onClick={() => excluir(confirmDelete.id)}
                style={{ ...btnPrimario, background: COLORS.danger, borderColor: COLORS.danger }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnotacaoCard({ anotacao, onEdit, onDelete }) {
  const [expandido, setExpandido] = useState(false);
  const longo = anotacao.texto.length > 200;

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
      borderTop: `3px solid ${COLORS.accent}` }}>
      {anotacao.titulo && (
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: COLORS.text, fontFamily: FONT.serif }}>
          {anotacao.titulo}
        </p>
      )}
      {anotacao.titulos && (
        <p style={{ margin: 0, fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>
          📖 {anotacao.titulos.titulo}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 14, color: COLORS.text, lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        overflow: expandido ? "visible" : "hidden",
        display: expandido ? "block" : "-webkit-box",
        WebkitLineClamp: expandido ? "unset" : 4,
        WebkitBoxOrient: "vertical",
      }}>
        {anotacao.texto}
      </p>
      {longo && (
        <button onClick={() => setExpandido(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13,
            color: COLORS.primary, fontWeight: 600, padding: 0, textAlign: "left" }}>
          {expandido ? "Ver menos" : "Ver mais"}
        </button>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: COLORS.textLight }}>{fmtData(anotacao.updated_at)}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEdit} style={btnSecundario}>Editar</button>
          <button onClick={onDelete} style={{ ...btnSecundario, color: COLORS.danger, borderColor: COLORS.danger }}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 };
const inputStyle = { width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`,
  borderRadius: 8, fontSize: 14, fontFamily: FONT.sans, boxSizing: "border-box",
  background: "#fff", color: COLORS.text, outline: "none" };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 4 };
const btnPrimario = { background: COLORS.primary, color: "#fff", border: "none",
  padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: FONT.sans };
const btnSecundario = { background: "#fff", color: COLORS.text, border: `1px solid ${COLORS.border}`,
  padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: FONT.sans };
const btnIcon = { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: COLORS.textLight, padding: "4px 8px" };
