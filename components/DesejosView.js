"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS, FONT } from "@/lib/design";

const supabase = createClient();

function DesejoModal({ desejo, userId, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: desejo?.titulo ?? "",
    autor: desejo?.autor ?? "",
    isbn: desejo?.isbn ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
    setLoading(true);
    setErro("");
    const payload = { ...form, user_id: userId, fonte: "manual" };
    let data, error;
    if (desejo?.id) {
      ({ data, error } = await supabase.from("desejos").update(payload).eq("id", desejo.id)
        .select("*, titulos(titulo, autor, exemplares(status))").single());
    } else {
      ({ data, error } = await supabase.from("desejos").insert(payload)
        .select("*, titulos(titulo, autor, exemplares(status))").single());
    }
    setLoading(false);
    if (error) { setErro(error.message); return; }
    onSave(data, !!desejo?.id);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ background: COLORS.bgCard, borderRadius: 16, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: FONT.serif }}>
            {desejo?.id ? "Editar Desejo" : "Adicionar à Lista"}
          </h2>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {[
            ["Título *", "titulo", "Ex: O Nome do Vento"],
            ["Autor", "autor", "Ex: Patrick Rothfuss"],
            ["ISBN", "isbn", "978-..."],
          ].map(([label, key, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)}
                placeholder={ph} style={inputStyle} />
            </div>
          ))}
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

export default function DesejosView({ desejosIniciais, userId }) {
  const [desejos, setDesejos] = useState(desejosIniciais);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busca, setBusca] = useState("");

  function onSave(d, isEdit) {
    if (isEdit) setDesejos(ds => ds.map(x => x.id === d.id ? d : x));
    else setDesejos(ds => [d, ...ds]);
    setModal(null);
  }

  async function excluir(id) {
    await supabase.from("desejos").delete().eq("id", id);
    setDesejos(ds => ds.filter(d => d.id !== id));
    setConfirmDelete(null);
  }

  const lista = useMemo(() => {
    if (!busca.trim()) return desejos;
    const q = busca.toLowerCase();
    return desejos.filter(d =>
      d.titulo.toLowerCase().includes(q) || d.autor?.toLowerCase().includes(q)
    );
  }, [desejos, busca]);

  const disponiveis = desejos.filter(d => d.titulos?.exemplares?.some(e => e.status === "Disponível")).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: FONT.serif, color: COLORS.text }}>Lista de Desejos</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textLight }}>
            Livros que você quer ler · {desejos.length} no total
            {disponiveis > 0 && <span style={{ color: COLORS.success, fontWeight: 600 }}> · {disponiveis} disponíve{disponiveis !== 1 ? "is" : "l"} no acervo</span>}
          </p>
        </div>
        <button onClick={() => setModal("novo")} style={btnPrimario}>+ Adicionar</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por título ou autor…" style={{ ...inputStyle, maxWidth: 320 }} />
      </div>

      {lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: COLORS.text }}>Sua lista está vazia</p>
          <p style={{ margin: 0, fontSize: 14 }}>Adicione livros que você quer ler para não perder de vista.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {lista.map(d => (
            <DesejoCard key={d.id} desejo={d}
              onEdit={() => setModal(d)}
              onDelete={() => setConfirmDelete(d)}
            />
          ))}
        </div>
      )}

      {modal && (
        <DesejoModal
          desejo={modal === "novo" ? null : modal}
          userId={userId}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDelete && (
        <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
          <div style={{ background: COLORS.bgCard, borderRadius: 16, maxWidth: 400, width: "100%",
            padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontFamily: FONT.serif }}>Remover da lista?</h3>
            <p style={{ color: COLORS.textLight, marginBottom: 20 }}>
              Remover <strong>{confirmDelete.titulo}</strong> da sua lista de desejos?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btnSecundario}>Cancelar</button>
              <button onClick={() => excluir(confirmDelete.id)}
                style={{ ...btnPrimario, background: COLORS.danger, borderColor: COLORS.danger }}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DesejoCard({ desejo, onEdit, onDelete }) {
  const noAcervo = !!desejo.titulos;
  const disponivel = desejo.titulos?.exemplares?.some(e => e.status === "Disponível");

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
      borderLeft: `4px solid ${disponivel ? COLORS.success : noAcervo ? COLORS.warn : COLORS.border}` }}>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: COLORS.text, fontFamily: FONT.serif }}>
          {desejo.titulo}
        </p>
        {desejo.autor && (
          <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.textLight }}>{desejo.autor}</p>
        )}
      </div>
      {noAcervo && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
          background: disponivel ? COLORS.successLight : COLORS.warnLight,
          color: disponivel ? COLORS.success : COLORS.warn,
          padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, alignSelf: "flex-start" }}>
          {disponivel ? "✓ Disponível no acervo" : "📚 No acervo — emprestado"}
        </div>
      )}
      {desejo.isbn && (
        <p style={{ margin: 0, fontSize: 12, color: COLORS.textLight }}>ISBN: {desejo.isbn}</p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onEdit} style={btnSecundario}>Editar</button>
        <button onClick={onDelete} style={{ ...btnSecundario, color: COLORS.danger, borderColor: COLORS.danger }}>Remover</button>
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
