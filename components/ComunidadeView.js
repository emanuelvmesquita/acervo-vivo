"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS, FONT } from "@/lib/design";
import { Heart, ThumbsUp, Lightbulb } from "lucide-react";

const supabase = createClient();

const COLUNAS_SUGESTAO = ["Em análise", "Planejado", "Em desenvolvimento", "Concluído", "Recusado"];
const PRIORIDADES = ["Alta", "Média", "Baixa"];
const COR_PRIORIDADE = { Alta: COLORS.danger, Média: COLORS.warn, Baixa: COLORS.textLight };

function fmtDataCurta(s) {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "";
}

function NovaSugestaoForm({ onCriar, criando }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  async function enviar() {
    if (!titulo.trim()) return;
    await onCriar(titulo.trim(), descricao.trim());
    setTitulo("");
    setDescricao("");
  }

  return (
    <div style={{ background: COLORS.bgCard, border: `1.5px solid ${COLORS.accent}33`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Lightbulb size={16} color={COLORS.accent} />
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: COLORS.text, fontFamily: FONT.serif }}>Sugerir algo novo</p>
      </div>
      <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da sugestão"
        style={{ ...inputStyle, marginBottom: 10 }} />
      <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
        placeholder="Descreva sua ideia (opcional)" style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={enviar} disabled={criando || !titulo.trim()}
          style={{ background: COLORS.accent, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: FONT.sans }}>
          {criando ? "Enviando…" : "Enviar sugestão"}
        </button>
      </div>
    </div>
  );
}

function SugestaoCard({ sugestao, votos, votei, onVotar, isAdmin, onAtualizar }) {
  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${COLORS.accent}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: COLORS.text }}>{sugestao.titulo}</p>
      {sugestao.descricao && (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{sugestao.descricao}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: sugestao.prioridade || isAdmin ? 10 : 0 }}>
        <span style={{ fontSize: 11, color: COLORS.textLight }}>{sugestao.profiles?.nome ?? "Usuário"} · {fmtDataCurta(sugestao.created_at)}</span>
        <button onClick={() => onVotar(sugestao)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${votei ? COLORS.accent : COLORS.border}`,
            borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600,
            color: votei ? COLORS.accent : COLORS.textLight, fontFamily: FONT.sans }}>
          <ThumbsUp size={12} /> {votos}
        </button>
      </div>
      {(sugestao.prioridade || isAdmin) && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isAdmin ? (
            <>
              <select value={sugestao.prioridade ?? ""} onChange={e => onAtualizar(sugestao, { prioridade: e.target.value || null })}
                style={{ ...selectMiniStyle, color: sugestao.prioridade ? COR_PRIORIDADE[sugestao.prioridade] : COLORS.textLight }}>
                <option value="">Prioridade</option>
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={sugestao.status_sugestao} onChange={e => onAtualizar(sugestao, { status_sugestao: e.target.value })}
                style={selectMiniStyle}>
                {COLUNAS_SUGESTAO.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          ) : sugestao.prioridade ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: COR_PRIORIDADE[sugestao.prioridade] }}>Prioridade {sugestao.prioridade}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SugestoesBoard({ sugestoes, votosPorSugestao, meusVotos, isAdmin, userId, onVotar, onAtualizar, onCriar, criando }) {
  const porColuna = useMemo(() => {
    const mapa = {};
    COLUNAS_SUGESTAO.forEach(c => mapa[c] = []);
    sugestoes.forEach(s => {
      (mapa[s.status_sugestao] ?? (mapa[s.status_sugestao] = [])).push(s);
    });
    Object.values(mapa).forEach(lista => lista.sort((a, b) => (votosPorSugestao[b.id] ?? 0) - (votosPorSugestao[a.id] ?? 0)));
    return mapa;
  }, [sugestoes, votosPorSugestao]);

  return (
    <div>
      <NovaSugestaoForm onCriar={onCriar} criando={criando} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLUNAS_SUGESTAO.length}, minmax(220px, 1fr))`, gap: 14, overflowX: "auto" }}>
        {COLUNAS_SUGESTAO.map(coluna => (
          <div key={coluna} style={{ background: `${COLORS.accent}0d`, border: `1px solid ${COLORS.accent}33`, borderRadius: 12, padding: "12px 10px", minWidth: 220 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {coluna} ({porColuna[coluna]?.length ?? 0})
            </p>
            {(porColuna[coluna] ?? []).length === 0 ? (
              <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>Nada por aqui.</p>
            ) : (
              porColuna[coluna].map(s => (
                <SugestaoCard key={s.id} sugestao={s} votos={votosPorSugestao[s.id] ?? 0} votei={meusVotos.has(s.id)}
                  onVotar={onVotar} isAdmin={isAdmin} onAtualizar={onAtualizar} />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtData(s) {
  if (!s) return "";
  const d = new Date(s);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("pt-BR");
}

function GrupoModal({ grupo, isAdmin, onSave, onClose }) {
  const [form, setForm] = useState({ nome: grupo?.nome ?? "", descricao: grupo?.descricao ?? "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setLoading(true);
    setErro("");
    let data, error;
    if (grupo?.id) {
      ({ data, error } = await supabase.from("grupos").update(form).eq("id", grupo.id).select().single());
    } else {
      ({ data, error } = await supabase.from("grupos").insert(form).select().single());
    }
    setLoading(false);
    if (error) { setErro(error.message); return; }
    onSave(data, !!grupo?.id);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ background: COLORS.bgCard, borderRadius: 16, width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: FONT.serif }}>
            {grupo?.id ? "Editar Grupo" : "Novo Grupo"}
          </h2>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome *</label>
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Clube do Livro" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Descrição</label>
            <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: "vertical" }} />
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

export default function ComunidadeView({ gruposIniciais, postsIniciais, sugestoesIniciais = [], votosIniciais = [], nomeAutor, userId, isAdmin }) {
  const [aba, setAba] = useState("feed");
  const [grupos, setGrupos] = useState(gruposIniciais);
  const [posts, setPosts] = useState(postsIniciais);
  const [grupoAtivo, setGrupoAtivo] = useState(gruposIniciais[0]?.id ?? null);
  const [modalGrupo, setModalGrupo] = useState(null);
  const [novoPost, setNovoPost] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [sugestoes, setSugestoes] = useState(sugestoesIniciais);
  const [votos, setVotos] = useState(votosIniciais);
  const [criandoSugestao, setCriandoSugestao] = useState(false);

  const votosPorSugestao = useMemo(() => {
    const mapa = {};
    votos.forEach(v => { mapa[v.sugestao_id] = (mapa[v.sugestao_id] ?? 0) + 1; });
    return mapa;
  }, [votos]);

  const meusVotos = useMemo(
    () => new Set(votos.filter(v => v.usuario_id === userId).map(v => v.sugestao_id)),
    [votos, userId]
  );

  async function criarSugestao(titulo, descricao) {
    setCriandoSugestao(true);
    const { data, error } = await supabase
      .from("sugestoes")
      .insert({ usuario_id: userId, titulo, descricao, status_sugestao: "Em análise" })
      .select("*, profiles(nome)")
      .single();
    setCriandoSugestao(false);
    if (!error && data) setSugestoes(ss => [data, ...ss]);
  }

  async function votarSugestao(sugestao) {
    const jaVotei = meusVotos.has(sugestao.id);
    if (jaVotei) {
      await supabase.from("sugestoes_votos").delete().eq("sugestao_id", sugestao.id).eq("usuario_id", userId);
      setVotos(vs => vs.filter(v => !(v.sugestao_id === sugestao.id && v.usuario_id === userId)));
    } else {
      await supabase.from("sugestoes_votos").insert({ sugestao_id: sugestao.id, usuario_id: userId });
      setVotos(vs => [...vs, { sugestao_id: sugestao.id, usuario_id: userId }]);
    }
  }

  async function atualizarSugestao(sugestao, campos) {
    const { data, error } = await supabase
      .from("sugestoes").update(campos).eq("id", sugestao.id)
      .select("*, profiles(nome)").single();
    if (!error && data) setSugestoes(ss => ss.map(s => s.id === sugestao.id ? data : s));
  }

  const postsFiltrados = useMemo(
    () => posts.filter(p => p.grupo_id === grupoAtivo),
    [posts, grupoAtivo]
  );

  const grupoAtivoObj = grupos.find(g => g.id === grupoAtivo);

  function onSaveGrupo(g, isEdit) {
    if (isEdit) setGrupos(gs => gs.map(x => x.id === g.id ? g : x));
    else { setGrupos(gs => [...gs, g].sort((a, b) => a.nome.localeCompare(b.nome))); setGrupoAtivo(g.id); }
    setModalGrupo(null);
  }

  async function excluirGrupo(id) {
    await supabase.from("grupos").delete().eq("id", id);
    setGrupos(gs => gs.filter(g => g.id !== id));
    const prox = grupos.find(g => g.id !== id);
    setGrupoAtivo(prox?.id ?? null);
  }

  async function publicar() {
    if (!novoPost.trim() || !grupoAtivo) return;
    setEnviando(true);
    const { data, error } = await supabase
      .from("posts")
      .insert({ grupo_id: grupoAtivo, autor: nomeAutor, texto: novoPost.trim() })
      .select()
      .single();
    setEnviando(false);
    if (!error && data) {
      setPosts(ps => [data, ...ps]);
      setNovoPost("");
    }
  }

  async function curtir(post) {
    const jaCurtiu = post.likes?.includes(nomeAutor);
    const novasLikes = jaCurtiu
      ? post.likes.filter(l => l !== nomeAutor)
      : [...(post.likes ?? []), nomeAutor];
    await supabase.from("posts").update({ likes: novasLikes }).eq("id", post.id);
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, likes: novasLikes } : p));
  }

  async function excluirPost(id) {
    await supabase.from("posts").delete().eq("id", id);
    setPosts(ps => ps.filter(p => p.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: FONT.serif, color: COLORS.text }}>Comunidade</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textLight }}>Grupos de leitura e discussões</p>
        </div>
        {isAdmin && aba === "feed" && (
          <button onClick={() => setModalGrupo("novo")} style={btnPrimario}>+ Novo Grupo</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1.5px solid ${COLORS.border}` }}>
        {[{ v: "feed", label: "Feed" }, { v: "sugestoes", label: `Sugestões${sugestoes.length ? ` (${sugestoes.length})` : ""}` }].map(({ v, label }) => (
          <button key={v} onClick={() => setAba(v)} style={{
            padding: "10px 4px", marginBottom: -2, fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer",
            color: aba === v ? (v === "sugestoes" ? COLORS.accent : COLORS.primaryDark) : COLORS.textLight,
            borderBottom: aba === v ? `2.5px solid ${v === "sugestoes" ? COLORS.accent : COLORS.primary}` : "2.5px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      {aba === "sugestoes" ? (
        <SugestoesBoard
          sugestoes={sugestoes}
          votosPorSugestao={votosPorSugestao}
          meusVotos={meusVotos}
          isAdmin={isAdmin}
          userId={userId}
          onVotar={votarSugestao}
          onAtualizar={atualizarSugestao}
          onCriar={criarSugestao}
          criando={criandoSugestao}
        />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
        {/* Sidebar de grupos */}
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <p style={{ margin: 0, padding: "12px 16px", fontSize: 11, fontWeight: 700,
            color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.05em",
            borderBottom: `1px solid ${COLORS.border}` }}>
            Grupos ({grupos.length})
          </p>
          {grupos.length === 0 ? (
            <p style={{ padding: "16px", fontSize: 13, color: COLORS.textLight, margin: 0 }}>
              {isAdmin ? "Crie o primeiro grupo." : "Nenhum grupo criado ainda."}
            </p>
          ) : (
            grupos.map(g => (
              <button key={g.id}
                onClick={() => setGrupoAtivo(g.id)}
                style={{
                  width: "100%", textAlign: "left", padding: "12px 16px", border: "none",
                  cursor: "pointer", borderBottom: `1px solid ${COLORS.border}`,
                  background: grupoAtivo === g.id ? COLORS.primaryDark : "transparent",
                  color: grupoAtivo === g.id ? "#fff" : COLORS.text,
                  fontFamily: FONT.sans, fontSize: 14,
                }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{g.nome}</p>
                {g.descricao && (
                  <p style={{ margin: "2px 0 0", fontSize: 12,
                    color: grupoAtivo === g.id ? "rgba(255,255,255,0.7)" : COLORS.textLight,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {g.descricao}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Feed */}
        <div>
          {!grupoAtivo ? (
            <div style={{ textAlign: "center", padding: "60px 24px", color: COLORS.textLight }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <p style={{ margin: 0, fontWeight: 600, color: COLORS.text }}>Selecione um grupo</p>
            </div>
          ) : (
            <>
              {/* Header do grupo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: FONT.serif, fontSize: 20 }}>{grupoAtivoObj?.nome}</h2>
                  {grupoAtivoObj?.descricao && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textLight }}>{grupoAtivoObj.descricao}</p>
                  )}
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setModalGrupo(grupoAtivoObj)} style={btnSecundario}>Editar</button>
                    <button onClick={() => excluirGrupo(grupoAtivo)}
                      style={{ ...btnSecundario, color: COLORS.danger, borderColor: COLORS.danger }}>
                      Excluir
                    </button>
                  </div>
                )}
              </div>

              {/* Caixa de post */}
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
                padding: "16px", marginBottom: 20 }}>
                <textarea
                  value={novoPost}
                  onChange={e => setNovoPost(e.target.value)}
                  placeholder="Compartilhe uma reflexão, citação ou discussão…"
                  rows={3}
                  style={{ ...inputStyle, resize: "none", marginBottom: 10 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={publicar} disabled={enviando || !novoPost.trim()} style={btnPrimario}>
                    {enviando ? "Publicando…" : "Publicar"}
                  </button>
                </div>
              </div>

              {/* Posts */}
              {postsFiltrados.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 24px", color: COLORS.textLight }}>
                  <p style={{ margin: 0 }}>Nenhuma publicação ainda. Seja o primeiro a compartilhar!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {postsFiltrados.map(p => (
                    <PostCard key={p.id} post={p} nomeAutor={nomeAutor} isAdmin={isAdmin}
                      onCurtir={() => curtir(p)}
                      onExcluir={() => excluirPost(p.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}

      {modalGrupo && (
        <GrupoModal
          grupo={modalGrupo === "novo" ? null : modalGrupo}
          isAdmin={isAdmin}
          onSave={onSaveGrupo}
          onClose={() => setModalGrupo(null)}
        />
      )}

      {/* Responsividade */}
      <style>{`
        @media (max-width: 600px) {
          .comunidade-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function PostCard({ post, nomeAutor, isAdmin, onCurtir, onExcluir }) {
  const jaCurtiu = post.likes?.includes(nomeAutor);
  const isAutor = post.autor === nomeAutor;

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {post.autor?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: COLORS.text }}>{post.autor}</p>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.textLight }}>{fmtData(post.created_at)}</p>
          </div>
        </div>
        {(isAutor || isAdmin) && (
          <button onClick={onExcluir}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13,
              color: COLORS.textLight, padding: "2px 8px" }}>
            ✕
          </button>
        )}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: COLORS.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {post.texto}
      </p>
      <button onClick={onCurtir}
        style={{ background: "none", border: `1px solid ${jaCurtiu ? COLORS.primary : COLORS.border}`,
          borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 13,
          color: jaCurtiu ? COLORS.primary : COLORS.textLight, fontWeight: jaCurtiu ? 600 : 400,
          fontFamily: FONT.sans }}>
        ♥ {post.likes?.length ?? 0}
      </button>
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
const selectMiniStyle = { border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "3px 6px",
  fontSize: 11, fontWeight: 600, fontFamily: FONT.sans, background: "#fff", cursor: "pointer", outline: "none" };
