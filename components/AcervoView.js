"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import { Plus, Search, BookOpen, Edit2, Trash2, X, Check } from "lucide-react";

const CONSERVACAO = ["Ótimo", "Bom", "Regular", "Ruim"];
const GENEROS_SUGERIDOS = ["Romance", "Ficção Científica", "Fantasia", "Terror", "Suspense", "Autoajuda", "Biográfico", "História", "Filosofia", "Poesia", "Infantil", "Técnico", "Outro"];

const LIVRO_VAZIO = {
  tombo: "", isbn: "", titulo: "", autor: "", ano: "", edicao: "",
  editora: "", local: "", paginas: "", generos: [], conservacao: "Bom",
  foto: "", nota: 0, comentario: "", status: "Disponível",
};

function Badge({ status }) {
  const ok = status === "Disponível";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: ok ? COLORS.successLight : COLORS.warnLight,
      color: ok ? COLORS.success : COLORS.warn,
    }}>{status}</span>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}
      />
    </div>
  );
}

function LivroForm({ livro, onChange, onSave, onClose, salvando }) {
  function field(k) { return { value: livro[k], onChange: v => onChange({ ...livro, [k]: v }) }; }

  function toggleGenero(g) {
    const gens = livro.generos.includes(g)
      ? livro.generos.filter(x => x !== g)
      : [...livro.generos, g];
    onChange({ ...livro, generos: gens });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px", overflowY: "auto",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 560, padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
            {livro.id ? "Editar livro" : "Novo livro"}
          </h2>
          <button onClick={onClose} style={{ color: COLORS.textLight, padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1 / -1" }}><Input label="Título *" placeholder="Título do livro" {...field("titulo")} /></div>
          <Input label="Autor" placeholder="Nome do autor" {...field("autor")} />
          <Input label="Tombo" placeholder="Nº de tombo" {...field("tombo")} />
          <Input label="ISBN" placeholder="978-..." {...field("isbn")} />
          <Input label="Ano" type="number" placeholder="2024" {...field("ano")} />
          <Input label="Editora" placeholder="Editora" {...field("editora")} />
          <Input label="Edição" placeholder="1ª" {...field("edicao")} />
          <Input label="Local" placeholder="Prateleira / sala" {...field("local")} />
          <Input label="Páginas" type="number" placeholder="0" {...field("paginas")} />
        </div>

        {/* Conservação */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Conservação</label>
          <div style={{ display: "flex", gap: 8 }}>
            {CONSERVACAO.map(c => (
              <button key={c} onClick={() => onChange({ ...livro, conservacao: c })} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1.5px solid ${livro.conservacao === c ? COLORS.primary : COLORS.border}`,
                background: livro.conservacao === c ? COLORS.primary : "transparent", color: livro.conservacao === c ? "#fff" : COLORS.text,
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Gêneros */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gêneros</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GENEROS_SUGERIDOS.map(g => (
              <button key={g} onClick={() => toggleGenero(g)} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 12, border: `1.5px solid ${livro.generos.includes(g) ? COLORS.primary : COLORS.border}`,
                background: livro.generos.includes(g) ? COLORS.primaryLight : "transparent", color: livro.generos.includes(g) ? "#fff" : COLORS.text,
              }}>{g}</button>
            ))}
          </div>
        </div>

        {/* Comentário */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Comentário</label>
          <textarea
            value={livro.comentario}
            onChange={e => onChange({ ...livro, comentario: e.target.value })}
            rows={3}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button
            onClick={onSave}
            disabled={!livro.titulo || salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: livro.titulo ? COLORS.primary : COLORS.border, color: livro.titulo ? "#fff" : COLORS.textLight }}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ mensagem, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: "28px 28px 24px", maxWidth: 360, width: "100%" }}>
        <p style={{ fontSize: 15, color: COLORS.text, marginBottom: 24 }}>{mensagem}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.danger, color: "#fff" }}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function AcervoView({ livrosIniciais }) {
  const [livros, setLivros] = useState(livrosIniciais);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [toast, setToast] = useState("");

  const supabase = createClient();

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const livrosFiltrados = useMemo(() => {
    return livros.filter(l => {
      const q = busca.toLowerCase();
      const matchBusca = !q || l.titulo?.toLowerCase().includes(q) || l.autor?.toLowerCase().includes(q) || l.isbn?.includes(q) || l.tombo?.includes(q);
      const matchStatus = filtroStatus === "Todos" || l.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [livros, busca, filtroStatus]);

  async function salvar() {
    if (!form?.titulo) return;
    setSalvando(true);
    const dados = { ...form };
    if (dados.paginas) dados.paginas = parseInt(dados.paginas) || null;
    delete dados.id;

    if (form.id) {
      const { data, error } = await supabase.from("livros").update(dados).eq("id", form.id).select().single();
      if (!error) {
        setLivros(ls => ls.map(l => l.id === form.id ? data : l));
        showToast("Livro atualizado.");
      }
    } else {
      const { data, error } = await supabase.from("livros").insert(dados).select().single();
      if (!error) {
        setLivros(ls => [...ls, data]);
        showToast("Livro adicionado.");
      }
    }
    setSalvando(false);
    setForm(null);
  }

  async function excluir(id) {
    const { error } = await supabase.from("livros").delete().eq("id", id);
    if (!error) {
      setLivros(ls => ls.filter(l => l.id !== id));
      showToast("Livro excluído.");
    }
    setExcluindo(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark }}>Acervo</h1>
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2 }}>{livros.length} título{livros.length !== 1 ? "s" : ""} cadastrado{livros.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setForm({ ...LIVRO_VAZIO })}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14 }}
        >
          <Plus size={16} /> Novo livro
        </button>
      </div>

      {/* Busca + filtro */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textLight }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por título, autor, ISBN ou tombo…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bgCard, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Disponível", "Emprestado"].map(s => (
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
      {livrosFiltrados.length === 0 ? (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <BookOpen size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: COLORS.textLight }}>
            {busca || filtroStatus !== "Todos" ? "Nenhum livro encontrado com esse filtro." : "Nenhum livro cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {livrosFiltrados.map(l => (
            <div key={l.id} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, lineHeight: 1.3, marginBottom: 2 }}>{l.titulo}</div>
                  <div style={{ fontSize: 12, color: COLORS.textLight }}>{l.autor || "—"}</div>
                </div>
                <Badge status={l.status} />
              </div>

              <div style={{ display: "flex", gap: 12, fontSize: 12, color: COLORS.textLight }}>
                {l.ano && <span>{l.ano}</span>}
                {l.editora && <span>{l.editora}</span>}
                {l.tombo && <span>#{l.tombo}</span>}
              </div>

              {l.generos?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {l.generos.slice(0, 3).map(g => (
                    <span key={g} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: COLORS.bg, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>{g}</span>
                  ))}
                  {l.generos.length > 3 && <span style={{ fontSize: 11, color: COLORS.textLight }}>+{l.generos.length - 3}</span>}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, marginTop: 4 }}>
                <button
                  onClick={() => setForm({ ...l, paginas: l.paginas ?? "", generos: l.generos ?? [] })}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.primary, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}` }}
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => setExcluindo(l)}
                  disabled={l.status === "Emprestado"}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: l.status === "Emprestado" ? COLORS.border : COLORS.danger, padding: "4px 10px", borderRadius: 6, border: `1px solid ${l.status === "Emprestado" ? COLORS.border : COLORS.dangerLight}` }}
                >
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulário */}
      {form && (
        <LivroForm
          livro={form}
          onChange={setForm}
          onSave={salvar}
          onClose={() => setForm(null)}
          salvando={salvando}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {excluindo && (
        <ConfirmModal
          mensagem={`Excluir "${excluindo.titulo}"? Essa ação não pode ser desfeita.`}
          onConfirm={() => excluir(excluindo.id)}
          onClose={() => setExcluindo(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          background: COLORS.primaryDark, color: "#fff",
          padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
