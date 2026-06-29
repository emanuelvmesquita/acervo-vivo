"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS, FONT } from "@/lib/design";

const supabase = createClient();

function hoje() {
  return new Date().toISOString().split("T")[0];
}
function addDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}
function fmtData(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
function diasRestantes(data) {
  const diff = Math.ceil((new Date(data + "T23:59:59") - new Date()) / 86400000);
  return diff;
}

// ─── LivroModal ────────────────────────────────────────────────
function LivroModal({ livro, userId, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: livro?.titulo ?? "",
    autor: livro?.autor ?? "",
    isbn: livro?.isbn ?? "",
    ano: livro?.ano ?? "",
    editora: livro?.editora ?? "",
    conservacao: livro?.conservacao ?? "Bom",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
    setLoading(true);
    setErro("");
    const payload = { ...form, user_id: userId };
    let data, error;
    if (livro?.id) {
      ({ data, error } = await supabase
        .from("minha_biblioteca_livros")
        .update(payload)
        .eq("id", livro.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from("minha_biblioteca_livros")
        .insert(payload)
        .select()
        .single());
    }
    setLoading(false);
    if (error) { setErro(error.message); return; }
    onSave(data, !!livro?.id);
  }

  const field = (label, key, opts = {}) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 4 }}>{label}</label>
      {opts.as === "select" ? (
        <select value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle}>
          {opts.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle} {...opts} />
      )}
    </div>
  );

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: FONT.serif }}>
            {livro?.id ? "Editar Livro" : "Adicionar Livro"}
          </h2>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {field("Título *", "titulo", { placeholder: "Ex: Dom Casmurro" })}
          {field("Autor", "autor", { placeholder: "Ex: Machado de Assis" })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>{field("ISBN", "isbn", { placeholder: "978-..." })}</div>
            <div>{field("Ano", "ano", { placeholder: "2001" })}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>{field("Editora", "editora")}</div>
            <div>{field("Conservação", "conservacao", { as: "select", options: ["Novo", "Bom", "Regular", "Desgastado"] })}</div>
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

// ─── EmprestimoModal ─────────────────────────────────────────
function EmprestimoModal({ livrosDisponiveis, userId, onSave, onClose }) {
  const [form, setForm] = useState({
    livro_id: livrosDisponiveis[0]?.id ?? "",
    amigo: "",
    data_emprestimo: hoje(),
    data_devolucao: addDias(14),
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.amigo.trim()) { setErro("Nome do amigo é obrigatório."); return; }
    if (!form.livro_id) { setErro("Selecione um livro."); return; }
    setLoading(true);
    setErro("");
    const { data: emp, error: empErr } = await supabase
      .from("minha_biblioteca_emprestimos")
      .insert({ ...form, user_id: userId, status: "Ativo" })
      .select("*, minha_biblioteca_livros(titulo, autor)")
      .single();
    if (empErr) { setErro(empErr.message); setLoading(false); return; }

    await supabase
      .from("minha_biblioteca_livros")
      .update({ status: "Emprestado" })
      .eq("id", form.livro_id);

    setLoading(false);
    onSave(emp);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: FONT.serif }}>Registrar Empréstimo</h2>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Livro *</label>
            <select value={form.livro_id} onChange={e => set("livro_id", e.target.value)} style={inputStyle}>
              {livrosDisponiveis.length === 0
                ? <option value="">Nenhum livro disponível</option>
                : livrosDisponiveis.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)
              }
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Para quem *</label>
            <input value={form.amigo} onChange={e => set("amigo", e.target.value)}
              placeholder="Nome do amigo" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Data empréstimo</label>
              <input type="date" value={form.data_emprestimo} onChange={e => set("data_emprestimo", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prazo devolução</label>
              <input type="date" value={form.data_devolucao} onChange={e => set("data_devolucao", e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[7, 14, 21, 30].map(d => (
              <button key={d} onClick={() => set("data_devolucao", addDias(d))}
                style={{ ...btnShortcut, background: form.data_devolucao === addDias(d) ? COLORS.primary : COLORS.bg }}>
                <span style={{ color: form.data_devolucao === addDias(d) ? "#fff" : COLORS.text }}>+{d}d</span>
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Observações</label>
            <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)}
              rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          {erro && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 12 }}>{erro}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecundario}>Cancelar</button>
            <button onClick={salvar} disabled={loading || !livrosDisponiveis.length} style={btnPrimario}>
              {loading ? "Salvando…" : "Registrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DevolucaoModal ──────────────────────────────────────────
function DevolucaoModal({ emprestimo, onSave, onClose }) {
  const [loading, setLoading] = useState(false);

  const dias = diasRestantes(emprestimo.data_devolucao);
  const atrasado = dias < 0;

  async function confirmar() {
    setLoading(true);
    const dataHoje = hoje();
    await supabase
      .from("minha_biblioteca_emprestimos")
      .update({ status: "Devolvido", data_devolvido: dataHoje })
      .eq("id", emprestimo.id);

    if (emprestimo.livro_id) {
      await supabase
        .from("minha_biblioteca_livros")
        .update({ status: "Disponível" })
        .eq("id", emprestimo.livro_id);
    }
    setLoading(false);
    onSave(emprestimo.id);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: FONT.serif }}>Confirmar Devolução</h2>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ marginTop: 0, color: COLORS.text }}>
            <strong>{emprestimo.minha_biblioteca_livros?.titulo ?? "Livro"}</strong> emprestado para <strong>{emprestimo.amigo}</strong>.
          </p>
          {atrasado && (
            <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ margin: 0, color: COLORS.danger, fontWeight: 600 }}>
                {Math.abs(dias)} dia{Math.abs(dias) !== 1 ? "s" : ""} em atraso
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecundario}>Cancelar</button>
            <button onClick={confirmar} disabled={loading} style={btnPrimario}>
              {loading ? "Registrando…" : "Confirmar devolução"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────
export default function MinhaBibliotecaView({ livrosIniciais, emprestimosIniciais, userId }) {
  const [aba, setAba] = useState("acervo");
  const [livros, setLivros] = useState(livrosIniciais);
  const [emprestimos, setEmprestimos] = useState(emprestimosIniciais);
  const [modalLivro, setModalLivro] = useState(null); // null | "novo" | livro
  const [modalEmprestimo, setModalEmprestimo] = useState(false);
  const [modalDevolucao, setModalDevolucao] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filtroEmp, setFiltroEmp] = useState("Todos");
  const [busca, setBusca] = useState("");

  const livrosDisponiveis = livros.filter(l => l.status === "Disponível");

  function onSaveLivro(livro, isEdit) {
    if (isEdit) setLivros(ls => ls.map(l => l.id === livro.id ? livro : l));
    else setLivros(ls => [...ls, livro].sort((a, b) => a.titulo.localeCompare(b.titulo)));
    setModalLivro(null);
  }

  function onSaveEmprestimo(emp) {
    setEmprestimos(es => [emp, ...es]);
    setLivros(ls => ls.map(l => l.id === emp.livro_id ? { ...l, status: "Emprestado" } : l));
    setModalEmprestimo(false);
  }

  function onDevolvido(empId) {
    const emp = emprestimos.find(e => e.id === empId);
    setEmprestimos(es => es.map(e => e.id === empId ? { ...e, status: "Devolvido", data_devolvido: hoje() } : e));
    if (emp?.livro_id) {
      setLivros(ls => ls.map(l => l.id === emp.livro_id ? { ...l, status: "Disponível" } : l));
    }
    setModalDevolucao(null);
  }

  async function excluirLivro(livro) {
    if (livro.status === "Emprestado") return;
    await supabase.from("minha_biblioteca_livros").delete().eq("id", livro.id);
    setLivros(ls => ls.filter(l => l.id !== livro.id));
    setConfirmDelete(null);
  }

  const empFiltrados = useMemo(() => {
    let list = emprestimos;
    if (filtroEmp !== "Todos") list = list.filter(e => e.status === filtroEmp);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(e =>
        e.amigo.toLowerCase().includes(q) ||
        e.minha_biblioteca_livros?.titulo?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emprestimos, filtroEmp, busca]);

  const livrosFiltrados = useMemo(() => {
    if (!busca.trim()) return livros;
    const q = busca.toLowerCase();
    return livros.filter(l => l.titulo.toLowerCase().includes(q) || l.autor?.toLowerCase().includes(q));
  }, [livros, busca]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: FONT.serif, color: COLORS.text }}>Minha Biblioteca</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textLight }}>Seu acervo pessoal e empréstimos a amigos</p>
        </div>
        <button
          onClick={() => aba === "acervo" ? setModalLivro("novo") : setModalEmprestimo(true)}
          style={btnPrimario}
        >
          + {aba === "acervo" ? "Adicionar Livro" : "Registrar Empréstimo"}
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: `2px solid ${COLORS.border}`, marginBottom: 24, gap: 0 }}>
        {[
          { key: "acervo", label: `Meu Acervo (${livros.length})` },
          { key: "emprestimos", label: `Empréstimos a Amigos (${emprestimos.filter(e => e.status === "Ativo").length} ativos)` },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setAba(tab.key); setBusca(""); }}
            style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14, color: aba === tab.key ? COLORS.primary : COLORS.textLight,
              borderBottom: aba === tab.key ? `2px solid ${COLORS.primary}` : "2px solid transparent",
              marginBottom: -2,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Aba Acervo ─── */}
      {aba === "acervo" && (
        <>
          <div style={{ marginBottom: 20 }}>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título ou autor…" style={{ ...inputStyle, maxWidth: 320 }} />
          </div>

          {livrosFiltrados.length === 0 ? (
            <EmptyState
              icon="📚"
              titulo="Nenhum livro ainda"
              sub={busca ? "Nenhum resultado para a busca." : "Adicione seus livros pessoais para controlar seu acervo."}
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {livrosFiltrados.map(livro => (
                <LivroCard key={livro.id} livro={livro}
                  onEdit={() => setModalLivro(livro)}
                  onDelete={() => setConfirmDelete(livro)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Aba Empréstimos ─── */}
      {aba === "emprestimos" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["Todos", "Ativo", "Atrasado", "Devolvido"].map(f => (
                <button key={f} onClick={() => setFiltroEmp(f)}
                  style={{ ...btnFiltro, background: filtroEmp === f ? COLORS.primary : COLORS.bg,
                    color: filtroEmp === f ? "#fff" : COLORS.text,
                    borderColor: filtroEmp === f ? COLORS.primary : COLORS.border }}>
                  {f}
                </button>
              ))}
            </div>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar livro ou amigo…" style={{ ...inputStyle, maxWidth: 260, marginBottom: 0 }} />
          </div>

          {empFiltrados.length === 0 ? (
            <EmptyState
              icon="🤝"
              titulo="Nenhum empréstimo"
              sub={filtroEmp !== "Todos" || busca ? "Nenhum resultado encontrado." : "Registre quando emprestar um livro seu para alguém."}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {empFiltrados.map(emp => (
                <EmprestimoCard key={emp.id} emprestimo={emp}
                  onDevolver={() => setModalDevolucao(emp)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      {modalLivro && (
        <LivroModal
          livro={modalLivro === "novo" ? null : modalLivro}
          userId={userId}
          onSave={onSaveLivro}
          onClose={() => setModalLivro(null)}
        />
      )}
      {modalEmprestimo && (
        <EmprestimoModal
          livrosDisponiveis={livrosDisponiveis}
          userId={userId}
          onSave={onSaveEmprestimo}
          onClose={() => setModalEmprestimo(false)}
        />
      )}
      {modalDevolucao && (
        <DevolucaoModal
          emprestimo={modalDevolucao}
          onSave={onDevolvido}
          onClose={() => setModalDevolucao(null)}
        />
      )}
      {confirmDelete && (
        <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...modalStyle, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 12px", fontFamily: FONT.serif }}>Remover livro?</h3>
              {confirmDelete.status === "Emprestado" ? (
                <p style={{ color: COLORS.danger }}>Não é possível remover um livro que está emprestado.</p>
              ) : (
                <p>Tem certeza que deseja remover <strong>{confirmDelete.titulo}</strong> do seu acervo?</p>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button onClick={() => setConfirmDelete(null)} style={btnSecundario}>Cancelar</button>
                {confirmDelete.status !== "Emprestado" && (
                  <button onClick={() => excluirLivro(confirmDelete)}
                    style={{ ...btnPrimario, background: COLORS.danger, borderColor: COLORS.danger }}>
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function LivroCard({ livro, onEdit, onDelete }) {
  const emprestado = livro.status === "Emprestado";
  return (
    <div style={{
      background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8,
      borderLeft: `4px solid ${emprestado ? COLORS.warn : COLORS.primary}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: COLORS.text, fontFamily: FONT.serif,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {livro.titulo}
          </p>
          {livro.autor && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.textLight }}>{livro.autor}</p>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          background: emprestado ? COLORS.warnLight : COLORS.successLight,
          color: emprestado ? COLORS.warn : COLORS.success,
          whiteSpace: "nowrap",
        }}>
          {livro.status}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {livro.editora && <Tag>{livro.editora}</Tag>}
        {livro.ano && <Tag>{livro.ano}</Tag>}
        {livro.conservacao && <Tag>{livro.conservacao}</Tag>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onEdit} style={btnSecundario}>Editar</button>
        <button onClick={onDelete} disabled={emprestado}
          style={{ ...btnSecundario, color: emprestado ? COLORS.neutralLight : COLORS.danger,
            borderColor: emprestado ? COLORS.border : COLORS.danger, opacity: emprestado ? 0.5 : 1 }}>
          Remover
        </button>
      </div>
    </div>
  );
}

function EmprestimoCard({ emprestimo, onDevolver }) {
  const [expandido, setExpandido] = useState(false);
  const dias = diasRestantes(emprestimo.data_devolucao);
  const ativo = emprestimo.status === "Ativo";
  const atrasado = ativo && dias < 0;
  const devolvido = emprestimo.status === "Devolvido";

  const borderColor = devolvido ? COLORS.border
    : atrasado ? COLORS.danger
    : dias <= 3 ? COLORS.warn
    : COLORS.primary;

  const statusColor = devolvido ? COLORS.textLight
    : atrasado ? COLORS.danger
    : COLORS.success;

  return (
    <div style={{
      background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      borderLeft: `4px solid ${borderColor}`, overflow: "hidden",
    }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", gap: 12 }} onClick={() => setExpandido(e => !e)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: COLORS.text }}>
            {emprestimo.minha_biblioteca_livros?.titulo ?? "Livro removido"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.textLight }}>
            para <strong>{emprestimo.amigo}</strong> · prazo {fmtData(emprestimo.data_devolucao)}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {ativo && (
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
              {atrasado ? `${Math.abs(dias)}d atrasado` : `${dias}d restante${dias !== 1 ? "s" : ""}`}
            </span>
          )}
          {devolvido && (
            <span style={{ fontSize: 12, color: COLORS.textLight }}>
              Devolvido {fmtData(emprestimo.data_devolvido)}
            </span>
          )}
          <span style={{ fontSize: 16, color: COLORS.textLight }}>{expandido ? "▲" : "▼"}</span>
        </div>
      </div>

      {expandido && (
        <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${COLORS.border}`, background: "#FAFAF8" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
            <InfoRow label="Emprestado em" value={fmtData(emprestimo.data_emprestimo)} />
            <InfoRow label="Prazo" value={fmtData(emprestimo.data_devolucao)} />
            {devolvido && <InfoRow label="Devolvido em" value={fmtData(emprestimo.data_devolvido)} />}
            {emprestimo.observacoes && <InfoRow label="Observações" value={emprestimo.observacoes} />}
          </div>
          {ativo && (
            <button onClick={onDevolver} style={btnPrimario}>
              Registrar devolução
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, titulo, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: COLORS.textLight }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: COLORS.text, fontSize: 16 }}>{titulo}</p>
      <p style={{ margin: 0, fontSize: 14 }}>{sub}</p>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{ fontSize: 11, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
      color: COLORS.textLight, padding: "2px 8px", borderRadius: 20 }}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: COLORS.textLight, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.text }}>{value}</p>
    </div>
  );
}

// ─── Shared styles ───────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 16,
};
const modalStyle = {
  background: COLORS.bgCard, borderRadius: 16, width: "100%",
  maxHeight: "90vh", overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};
const modalHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}`,
};
const inputStyle = {
  width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`,
  borderRadius: 8, fontSize: 14, fontFamily: FONT.sans, boxSizing: "border-box",
  background: "#fff", color: COLORS.text, outline: "none",
};
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 4 };
const btnPrimario = {
  background: COLORS.primary, color: "#fff", border: "none",
  padding: "10px 20px", borderRadius: 8, cursor: "pointer",
  fontWeight: 600, fontSize: 14, fontFamily: FONT.sans,
};
const btnSecundario = {
  background: "#fff", color: COLORS.text, border: `1px solid ${COLORS.border}`,
  padding: "8px 16px", borderRadius: 8, cursor: "pointer",
  fontWeight: 600, fontSize: 13, fontFamily: FONT.sans,
};
const btnIcon = {
  background: "none", border: "none", cursor: "pointer",
  fontSize: 18, color: COLORS.textLight, padding: "4px 8px",
};
const btnFiltro = {
  padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.border}`,
  cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONT.sans,
};
const btnShortcut = {
  padding: "5px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
  cursor: "pointer", fontSize: 12, fontFamily: FONT.sans,
};
