"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import {
  Plus, Search, BookOpen, Edit2, Trash2, X, Check, LayoutGrid, List,
  Users, Ban, Clock, CheckCircle2,
} from "lucide-react";
import BuscaGoogleBooks from "@/components/BuscaGoogleBooks";

const CONSERVACAO = ["Ótimo", "Bom", "Regular", "Ruim"];
const GENEROS_SUGERIDOS = ["Romance", "Ficção Científica", "Fantasia", "Terror", "Suspense", "Autoajuda", "Biográfico", "História", "Filosofia", "Poesia", "Infantil", "Técnico", "Outro"];

const TITULO_VAZIO = {
  isbn: "", titulo: "", autor: "", ano: "", edicao: "", editora: "",
  paginas: "", generos: [], foto: "", comentario: "",
};

const EXEMPLAR_VAZIO = { tombo: "", local: "", conservacao: "Bom" };

function fmtData(s) {
  if (!s) return "";
  const [y, m, d] = s.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

function MeuStatusBadge({ tipo }) {
  const cfg = {
    emprestado: { bg: COLORS.bg, fg: COLORS.textLight, icon: CheckCircle2, texto: "Emprestado para você" },
    pendente: { bg: COLORS.warnLight, fg: COLORS.warn, icon: Clock, texto: "Em confirmação" },
    espera: { bg: COLORS.bg, fg: COLORS.textLight, icon: Users, texto: "Na lista de espera" },
  }[tipo];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
      padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 600,
      background: cfg.bg, color: cfg.fg,
    }}><Icon size={11} /> {cfg.texto}</span>
  );
}

function DisponibilidadeBadge({ disponiveis, total }) {
  const ok = disponiveis > 0;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: ok ? COLORS.successLight : COLORS.warnLight,
      color: ok ? COLORS.success : COLORS.warn,
    }}>{disponiveis} de {total} disponíve{disponiveis === 1 ? "l" : "is"}</span>
  );
}

function ExemplarStatusBadge({ status }) {
  const cfg = {
    "Disponível": { bg: COLORS.successLight, fg: COLORS.success },
    "Emprestado": { bg: COLORS.warnLight, fg: COLORS.warn },
    "Indisponível": { bg: COLORS.dangerLight, fg: COLORS.danger },
  }[status] ?? { bg: COLORS.bg, fg: COLORS.textLight };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.fg,
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

function Modal({ children, maxWidth = 560, zIndex = 100, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px", overflowY: "auto",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth, padding: "28px 28px 24px" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ titulo, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
      <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>{titulo}</h2>
      <button onClick={onClose} style={{ color: COLORS.textLight, padding: 4 }}><X size={20} /></button>
    </div>
  );
}

function TituloForm({ titulo, exemplar, onChangeTitulo, onChangeExemplar, onSave, onClose, salvando, modoNovo }) {
  function field(k) { return { value: titulo[k], onChange: v => onChangeTitulo({ ...titulo, [k]: v }) }; }

  function toggleGenero(g) {
    const gens = titulo.generos.includes(g)
      ? titulo.generos.filter(x => x !== g)
      : [...titulo.generos, g];
    onChangeTitulo({ ...titulo, generos: gens });
  }

  function preencherDoGoogle(dados) {
    onChangeTitulo({ ...titulo, ...dados });
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader titulo={modoNovo ? "Novo livro" : "Editar livro"} onClose={onClose} />

      {modoNovo && <BuscaGoogleBooks onPreencher={preencherDoGoogle} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1 / -1" }}><Input label="Título *" placeholder="Título do livro" {...field("titulo")} /></div>
        <Input label="Autor" placeholder="Nome do autor" {...field("autor")} />
        <Input label="ISBN" placeholder="978-..." {...field("isbn")} />
        <Input label="Ano" type="number" placeholder="2024" {...field("ano")} />
        <Input label="Editora" placeholder="Editora" {...field("editora")} />
        <Input label="Edição" placeholder="1ª" {...field("edicao")} />
        <Input label="Páginas" type="number" placeholder="0" {...field("paginas")} />
      </div>

      {modoNovo && (
        <>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.08em", margin: "4px 0 8px" }}>
            Primeiro exemplar
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label="Tombo" placeholder="Nº de tombo" value={exemplar.tombo} onChange={v => onChangeExemplar({ ...exemplar, tombo: v })} />
            <Input label="Local" placeholder="Prateleira / sala" value={exemplar.local} onChange={v => onChangeExemplar({ ...exemplar, local: v })} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Conservação</label>
            <div style={{ display: "flex", gap: 8 }}>
              {CONSERVACAO.map(c => (
                <button key={c} onClick={() => onChangeExemplar({ ...exemplar, conservacao: c })} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1.5px solid ${exemplar.conservacao === c ? COLORS.primary : COLORS.border}`,
                  background: exemplar.conservacao === c ? COLORS.primary : "transparent", color: exemplar.conservacao === c ? "#fff" : COLORS.text,
                }}>{c}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Capa */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Capa</label>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 72, height: 100, flexShrink: 0, borderRadius: 6, border: `1.5px solid ${COLORS.border}`, overflow: "hidden", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {titulo.foto
              ? <img src={titulo.foto} alt="Capa" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} />
              : <BookOpen size={24} color={COLORS.border} />}
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={titulo.foto}
              onChange={e => onChangeTitulo({ ...titulo, foto: e.target.value })}
              placeholder="URL da imagem da capa"
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, background: COLORS.bg, outline: "none", boxSizing: "border-box" }}
            />
            {titulo.foto && (
              <button onClick={() => onChangeTitulo({ ...titulo, foto: "" })}
                style={{ marginTop: 6, fontSize: 12, color: COLORS.danger, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Remover imagem
              </button>
            )}
            <p style={{ margin: "6px 0 0", fontSize: 11, color: COLORS.textLight }}>
              Preenchida automaticamente pelo Google Books ou cole uma URL manualmente.
            </p>
          </div>
        </div>
      </div>

      {/* Gêneros */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gêneros</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GENEROS_SUGERIDOS.map(g => (
            <button key={g} onClick={() => toggleGenero(g)} style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, border: `1.5px solid ${titulo.generos.includes(g) ? COLORS.primary : COLORS.border}`,
              background: titulo.generos.includes(g) ? COLORS.primaryLight : "transparent", color: titulo.generos.includes(g) ? "#fff" : COLORS.text,
            }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Comentário */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Comentário</label>
        <textarea
          value={titulo.comentario}
          onChange={e => onChangeTitulo({ ...titulo, comentario: e.target.value })}
          rows={3}
          style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
        <button
          onClick={onSave}
          disabled={!titulo.titulo || salvando}
          style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: titulo.titulo ? COLORS.primary : COLORS.border, color: titulo.titulo ? "#fff" : COLORS.textLight }}
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}

function ExemplarForm({ exemplar, onChange, onSave, onClose, salvando, modoNovo }) {
  return (
    <Modal maxWidth={420} zIndex={120} onClose={onClose}>
      <ModalHeader titulo={modoNovo ? "Novo exemplar" : "Editar exemplar"} onClose={onClose} />
      <Input label="Tombo" placeholder="Nº de tombo" value={exemplar.tombo} onChange={v => onChange({ ...exemplar, tombo: v })} />
      <Input label="Local" placeholder="Prateleira / sala" value={exemplar.local} onChange={v => onChange({ ...exemplar, local: v })} />
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Conservação</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CONSERVACAO.map(c => (
            <button key={c} onClick={() => onChange({ ...exemplar, conservacao: c })} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1.5px solid ${exemplar.conservacao === c ? COLORS.primary : COLORS.border}`,
              background: exemplar.conservacao === c ? COLORS.primary : "transparent", color: exemplar.conservacao === c ? "#fff" : COLORS.text,
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
        <button onClick={onSave} disabled={salvando} style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.primary, color: "#fff" }}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}

function IndisponivelForm({ exemplar, onConfirm, onClose, salvando }) {
  const [motivo, setMotivo] = useState("");
  return (
    <Modal maxWidth={420} zIndex={130} onClose={onClose}>
      <ModalHeader titulo="Marcar como indisponível" onClose={onClose} />
      <p style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 14 }}>
        Exemplar {exemplar.tombo ? `#${exemplar.tombo}` : ""} ficará fora da contagem de disponibilidade até ser reativado.
      </p>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Motivo (opcional)</label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={3}
          placeholder="Ex: em restauração, extraviado, danificado…"
          style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
        <button onClick={() => onConfirm(motivo)} disabled={salvando} style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.danger, color: "#fff" }}>
          {salvando ? "Salvando…" : "Marcar indisponível"}
        </button>
      </div>
    </Modal>
  );
}

function SolicitarEmprestimoModal({ titulo, onConfirm, onClose, enviando }) {
  const [dataDesejada, setDataDesejada] = useState("");
  return (
    <Modal maxWidth={420} zIndex={120} onClose={onClose}>
      <ModalHeader titulo="Solicitar empréstimo" onClose={onClose} />
      <p style={{ fontSize: 14, color: COLORS.text, marginBottom: 16 }}>
        <strong>{titulo.titulo}</strong> — sua solicitação será enviada para análise da administração.
      </p>
      <Input label="Data de devolução desejada (opcional)" type="date" value={dataDesejada} onChange={setDataDesejada} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
        <button onClick={() => onConfirm(dataDesejada || null)} disabled={enviando} style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.primary, color: "#fff" }}>
          {enviando ? "Enviando…" : "Solicitar"}
        </button>
      </div>
    </Modal>
  );
}

function ConfirmModal({ mensagem, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 140, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
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

function TituloDetalheModal({
  titulo, exemplaresDoTitulo, isAdmin,
  minhaEmprestimoAtivo, minhaSolicitacaoPendente, minhaEntradaListaEspera, listaEsperaDoTitulo,
  onClose, onEditarExemplar, onNovoExemplar, onExcluirExemplar,
  onMarcarIndisponivel, onMarcarDisponivel,
  onSolicitarEmprestimo, onCancelarSolicitacao,
  onEntrarListaEspera, onSairListaEspera,
}) {
  const disponiveis = exemplaresDoTitulo.filter(e => e.status === "Disponível").length;

  return (
    <Modal maxWidth={640} zIndex={90} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 19, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 4 }}>{titulo.titulo}</h2>
          <p style={{ fontSize: 13, color: COLORS.textLight }}>{[titulo.autor, titulo.editora, titulo.ano].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <button onClick={onClose} style={{ color: COLORS.textLight, padding: 4, flexShrink: 0 }}><X size={20} /></button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <DisponibilidadeBadge disponiveis={disponiveis} total={exemplaresDoTitulo.length} />
      </div>

      {/* Exemplares */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Exemplares ({exemplaresDoTitulo.length})
          </p>
          {isAdmin && (
            <button onClick={onNovoExemplar} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: COLORS.primary, background: "none", border: "none", cursor: "pointer" }}>
              <Plus size={13} /> Adicionar exemplar
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exemplaresDoTitulo.map(e => (
            <div key={e.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, color: COLORS.text }}>
                  {e.tombo ? <strong>#{e.tombo}</strong> : <span style={{ color: COLORS.textLight }}>sem tombo</span>}
                  {e.local && <span style={{ color: COLORS.textLight }}> · {e.local}</span>}
                  {e.conservacao && <span style={{ color: COLORS.textLight }}> · {e.conservacao}</span>}
                </div>
                <ExemplarStatusBadge status={e.status} />
              </div>
              {e.status === "Indisponível" && e.motivo_indisponivel && (
                <p style={{ fontSize: 12, color: COLORS.danger, margin: "6px 0 0" }}>Motivo: {e.motivo_indisponivel}</p>
              )}
              {isAdmin && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button onClick={() => onEditarExemplar(e)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.primary, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "none", cursor: "pointer" }}>
                    <Edit2 size={12} /> Editar
                  </button>
                  {e.status === "Disponível" && (
                    <button onClick={() => onMarcarIndisponivel(e)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.danger, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.dangerLight}`, background: "none", cursor: "pointer" }}>
                      <Ban size={12} /> Marcar indisponível
                    </button>
                  )}
                  {e.status === "Indisponível" && (
                    <button onClick={() => onMarcarDisponivel(e)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.success, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.successLight}`, background: "none", cursor: "pointer" }}>
                      <CheckCircle2 size={12} /> Marcar disponível
                    </button>
                  )}
                  <button onClick={() => onExcluirExemplar(e)} disabled={e.status === "Emprestado"}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: e.status === "Emprestado" ? COLORS.border : COLORS.danger, padding: "4px 10px", borderRadius: 6, border: `1px solid ${e.status === "Emprestado" ? COLORS.border : COLORS.dangerLight}`, background: "none", cursor: "pointer" }}>
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {exemplaresDoTitulo.length === 0 && (
            <p style={{ fontSize: 13, color: COLORS.textLight }}>Nenhum exemplar cadastrado.</p>
          )}
        </div>
      </div>

      {/* Ação do leitor */}
      {!isAdmin && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
          {minhaEmprestimoAtivo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.bg, borderRadius: 10, padding: "12px 14px" }}>
              <CheckCircle2 size={16} color={COLORS.textLight} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Emprestado</p>
                <p style={{ fontSize: 12, color: COLORS.textLight }}>Você já está com um exemplar deste título.</p>
              </div>
            </div>
          ) : minhaSolicitacaoPendente ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.warnLight, borderRadius: 10, padding: "12px 14px" }}>
              <Clock size={16} color={COLORS.warn} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Solicitação de empréstimo pendente</p>
                <p style={{ fontSize: 12, color: COLORS.textLight }}>Aguardando confirmação da administração.</p>
              </div>
              <button onClick={() => onCancelarSolicitacao(minhaSolicitacaoPendente.id)} style={{ fontSize: 12, color: COLORS.danger, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                Cancelar
              </button>
            </div>
          ) : disponiveis > 0 ? (
            <button onClick={onSolicitarEmprestimo} style={{ width: "100%", padding: "11px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.primary, color: "#fff" }}>
              Solicitar empréstimo
            </button>
          ) : minhaEntradaListaEspera ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.bg, borderRadius: 10, padding: "12px 14px" }}>
              <Users size={16} color={COLORS.textLight} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Você está na lista de espera</p>
                <p style={{ fontSize: 12, color: COLORS.textLight }}>Desde {fmtData(minhaEntradaListaEspera.created_at)}.</p>
              </div>
              <button onClick={() => onSairListaEspera(minhaEntradaListaEspera.id)} style={{ fontSize: 12, color: COLORS.danger, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                Sair da lista
              </button>
            </div>
          ) : (
            <button onClick={onEntrarListaEspera} style={{ width: "100%", padding: "11px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, background: COLORS.accent, color: "#fff" }}>
              Entrar na lista de espera
            </button>
          )}
        </div>
      )}

      {/* Lista de espera (admin) */}
      {isAdmin && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Lista de espera ({listaEsperaDoTitulo.length})
          </p>
          {listaEsperaDoTitulo.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.textLight }}>Nenhum leitor na lista de espera.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {listaEsperaDoTitulo.map((le, i) => (
                <div key={le.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: i < listaEsperaDoTitulo.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <span style={{ color: COLORS.text }}>{i + 1}. {le.profiles?.nome ?? "—"}</span>
                  <span style={{ color: COLORS.textLight, fontSize: 12 }}>{fmtData(le.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AcervoView({
  titulosIniciais, exemplaresIniciais, isAdmin = false, userId,
  minhasSolicitacoesIniciais = [], minhaListaEsperaIniciais = [], listaEsperaTodosIniciais = [],
  meusEmprestimosAtivosIniciais = [],
}) {
  const [titulos, setTitulos] = useState(titulosIniciais);
  const [exemplares, setExemplares] = useState(exemplaresIniciais);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState(minhasSolicitacoesIniciais);
  const [minhaListaEspera, setMinhaListaEspera] = useState(minhaListaEsperaIniciais);
  const listaEsperaTodos = listaEsperaTodosIniciais;
  const meusEmprestimosAtivos = meusEmprestimosAtivosIniciais;

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [visualizacao, setVisualizacao] = useState("grade");

  const [form, setForm] = useState(null);
  const [formExemplar, setFormExemplar] = useState({ tombo: "", local: "", conservacao: "Bom" });
  const [modoNovo, setModoNovo] = useState(false);

  const [exemplarForm, setExemplarForm] = useState(null); // { tituloId, exemplar, modoNovo }
  const [indisponivelTarget, setIndisponivelTarget] = useState(null);
  const [solicitarTarget, setSolicitarTarget] = useState(null);
  const [detalheTituloId, setDetalheTituloId] = useState(null);
  const [excluindoTitulo, setExcluindoTitulo] = useState(null);
  const [excluindoExemplar, setExcluindoExemplar] = useState(null);

  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTipo, setToastTipo] = useState("ok");

  const supabase = createClient();

  function showToast(msg, tipo = "ok") {
    setToast(msg);
    setToastTipo(tipo);
    setTimeout(() => setToast(""), tipo === "erro" ? 5000 : 3000);
  }

  const statsPorTitulo = useMemo(() => {
    const map = new Map();
    for (const t of titulos) map.set(t.id, { disponiveis: 0, total: 0 });
    for (const e of exemplares) {
      const s = map.get(e.titulo_id);
      if (!s) continue;
      s.total++;
      if (e.status === "Disponível") s.disponiveis++;
    }
    return map;
  }, [titulos, exemplares]);

  const minhasSolicitacoesPendentesPorTitulo = useMemo(() => {
    const map = new Map();
    for (const s of minhasSolicitacoes) {
      if (s.status === "Pendente") map.set(s.titulo_id, s);
    }
    return map;
  }, [minhasSolicitacoes]);

  const minhaListaEsperaPorTitulo = useMemo(() => {
    const map = new Map();
    for (const le of minhaListaEspera) map.set(le.titulo_id, le);
    return map;
  }, [minhaListaEspera]);

  const listaEsperaPorTitulo = useMemo(() => {
    const map = new Map();
    for (const le of listaEsperaTodos) {
      if (!map.has(le.titulo_id)) map.set(le.titulo_id, []);
      map.get(le.titulo_id).push(le);
    }
    return map;
  }, [listaEsperaTodos]);

  const meuEmprestimoAtivoPorTitulo = useMemo(() => {
    const exemplarParaTitulo = new Map(exemplares.map(e => [e.id, e.titulo_id]));
    const map = new Map();
    for (const emp of meusEmprestimosAtivos) {
      const tituloId = exemplarParaTitulo.get(emp.exemplar_id);
      if (tituloId) map.set(tituloId, emp);
    }
    return map;
  }, [exemplares, meusEmprestimosAtivos]);

  function meuStatusTitulo(tituloId, disponiveis) {
    if (isAdmin) return null;
    if (meuEmprestimoAtivoPorTitulo.get(tituloId)) return "emprestado";
    if (minhasSolicitacoesPendentesPorTitulo.get(tituloId)) return "pendente";
    if (disponiveis === 0 && minhaListaEsperaPorTitulo.get(tituloId)) return "espera";
    return null;
  }

  const titulosFiltrados = useMemo(() => {
    return titulos.filter(t => {
      const q = busca.toLowerCase();
      const exemplaresDoTitulo = exemplares.filter(e => e.titulo_id === t.id);
      const matchBusca = !q || t.titulo?.toLowerCase().includes(q) || t.autor?.toLowerCase().includes(q) || t.isbn?.includes(q) || exemplaresDoTitulo.some(e => e.tombo?.includes(q));
      const disponiveis = statsPorTitulo.get(t.id)?.disponiveis ?? 0;
      const matchStatus = filtroStatus === "Todos" || (filtroStatus === "Disponível" ? disponiveis > 0 : disponiveis === 0);
      return matchBusca && matchStatus;
    });
  }, [titulos, exemplares, busca, filtroStatus, statsPorTitulo]);

  const detalheTitulo = detalheTituloId ? titulos.find(t => t.id === detalheTituloId) : null;

  function abrirNovoTitulo() {
    setModoNovo(true);
    setForm({ ...TITULO_VAZIO });
    setFormExemplar({ ...EXEMPLAR_VAZIO });
  }

  function abrirEditarTitulo(t) {
    setModoNovo(false);
    setForm({ ...TITULO_VAZIO, ...t, paginas: t.paginas ?? "", generos: t.generos ?? [] });
  }

  async function salvarTitulo() {
    if (!form?.titulo) return;
    setSalvando(true);
    const dados = { ...form };
    if (dados.paginas) dados.paginas = parseInt(dados.paginas) || null;
    delete dados.id;

    if (modoNovo) {
      const { data: novoTitulo, error } = await supabase.from("titulos").insert(dados).select().single();
      if (error) {
        console.error(error);
        showToast(`Erro ao adicionar livro: ${error.message}`, "erro");
        setSalvando(false);
        return;
      }
      const { data: novoExemplar, error: errExemplar } = await supabase
        .from("exemplares")
        .insert({ ...formExemplar, titulo_id: novoTitulo.id, status: "Disponível" })
        .select().single();
      if (errExemplar) {
        console.error(errExemplar);
        setTitulos(ts => [...ts, novoTitulo]);
        showToast(`Livro criado, mas falhou ao adicionar o exemplar: ${errExemplar.message}`, "erro");
        setSalvando(false);
        setForm(null);
        return;
      }
      setTitulos(ts => [...ts, novoTitulo]);
      setExemplares(es => [...es, novoExemplar]);
      showToast("Livro adicionado.");
    } else {
      const { data, error } = await supabase.from("titulos").update(dados).eq("id", form.id).select().single();
      if (error) {
        console.error(error);
        showToast(`Erro ao salvar livro: ${error.message}`, "erro");
        setSalvando(false);
        return;
      }
      setTitulos(ts => ts.map(t => t.id === form.id ? data : t));
      showToast("Livro atualizado.");
    }
    setSalvando(false);
    setForm(null);
  }

  async function excluirTitulo(id) {
    const { error } = await supabase.from("titulos").delete().eq("id", id);
    if (error) {
      console.error(error);
      showToast(`Erro ao excluir livro: ${error.message}`, "erro");
      return;
    }
    setTitulos(ts => ts.filter(t => t.id !== id));
    setExemplares(es => es.filter(e => e.titulo_id !== id));
    showToast("Livro excluído.");
    setExcluindoTitulo(null);
  }

  function abrirNovoExemplar(tituloId) {
    setExemplarForm({ tituloId, exemplar: { ...EXEMPLAR_VAZIO }, modoNovo: true });
  }

  function abrirEditarExemplar(exemplar) {
    setExemplarForm({ tituloId: exemplar.titulo_id, exemplar: { ...exemplar }, modoNovo: false });
  }

  async function salvarExemplar() {
    if (!exemplarForm) return;
    setSalvando(true);
    const { tituloId, exemplar, modoNovo: novo } = exemplarForm;
    if (novo) {
      const { data, error } = await supabase
        .from("exemplares")
        .insert({ tombo: exemplar.tombo, local: exemplar.local, conservacao: exemplar.conservacao, titulo_id: tituloId, status: "Disponível" })
        .select().single();
      if (error) {
        console.error(error);
        showToast(`Erro ao adicionar exemplar: ${error.message}`, "erro");
        setSalvando(false);
        return;
      }
      setExemplares(es => [...es, data]);
      showToast("Exemplar adicionado.");
    } else {
      const { data, error } = await supabase
        .from("exemplares")
        .update({ tombo: exemplar.tombo, local: exemplar.local, conservacao: exemplar.conservacao })
        .eq("id", exemplar.id).select().single();
      if (error) {
        console.error(error);
        showToast(`Erro ao salvar exemplar: ${error.message}`, "erro");
        setSalvando(false);
        return;
      }
      setExemplares(es => es.map(e => e.id === exemplar.id ? data : e));
      showToast("Exemplar atualizado.");
    }
    setSalvando(false);
    setExemplarForm(null);
  }

  async function excluirExemplar(exemplar) {
    const { error } = await supabase.from("exemplares").delete().eq("id", exemplar.id);
    if (error) {
      console.error(error);
      showToast(`Erro ao excluir exemplar: ${error.message}`, "erro");
      return;
    }
    setExemplares(es => es.filter(e => e.id !== exemplar.id));
    showToast("Exemplar excluído.");
    setExcluindoExemplar(null);
  }

  async function confirmarIndisponivel(motivo) {
    if (!indisponivelTarget) return;
    setSalvando(true);
    const { data, error } = await supabase
      .from("exemplares")
      .update({ status: "Indisponível", motivo_indisponivel: motivo || null })
      .eq("id", indisponivelTarget.id).select().single();
    if (error) {
      console.error(error);
      showToast(`Erro ao marcar indisponível: ${error.message}`, "erro");
      setSalvando(false);
      return;
    }
    setExemplares(es => es.map(e => e.id === data.id ? data : e));
    showToast("Exemplar marcado como indisponível.");
    setSalvando(false);
    setIndisponivelTarget(null);
  }

  async function marcarDisponivel(exemplar) {
    const { data, error } = await supabase
      .from("exemplares")
      .update({ status: "Disponível", motivo_indisponivel: null })
      .eq("id", exemplar.id).select().single();
    if (error) {
      console.error(error);
      showToast(`Erro ao marcar disponível: ${error.message}`, "erro");
      return;
    }
    setExemplares(es => es.map(e => e.id === data.id ? data : e));
    showToast("Exemplar marcado como disponível.");
  }

  async function solicitarEmprestimo(dataDesejada) {
    if (!solicitarTarget) return;
    setEnviando(true);
    const { data, error } = await supabase
      .from("solicitacoes_emprestimo")
      .insert({ titulo_id: solicitarTarget.id, usuario_id: userId, data_desejada: dataDesejada, status: "Pendente" })
      .select().single();
    if (error) {
      console.error(error);
      showToast(`Erro ao solicitar empréstimo: ${error.message}`, "erro");
      setEnviando(false);
      return;
    }
    setMinhasSolicitacoes(ss => [...ss, data]);
    showToast("Solicitação enviada. Aguarde a confirmação da administração.");
    setEnviando(false);
    setSolicitarTarget(null);
  }

  async function cancelarSolicitacao(id) {
    const { error } = await supabase.from("solicitacoes_emprestimo").delete().eq("id", id);
    if (error) {
      console.error(error);
      showToast(`Erro ao cancelar solicitação: ${error.message}`, "erro");
      return;
    }
    setMinhasSolicitacoes(ss => ss.filter(s => s.id !== id));
    showToast("Solicitação cancelada.");
  }

  async function entrarListaEspera(tituloId) {
    const { data, error } = await supabase
      .from("lista_espera")
      .insert({ titulo_id: tituloId, usuario_id: userId })
      .select().single();
    if (error) {
      console.error(error);
      showToast(`Erro ao entrar na lista de espera: ${error.message}`, "erro");
      return;
    }
    setMinhaListaEspera(ls => [...ls, data]);
    showToast("Você entrou na lista de espera.");
  }

  async function sairListaEspera(id) {
    const { error } = await supabase.from("lista_espera").delete().eq("id", id);
    if (error) {
      console.error(error);
      showToast(`Erro ao sair da lista de espera: ${error.message}`, "erro");
      return;
    }
    setMinhaListaEspera(ls => ls.filter(l => l.id !== id));
    showToast("Você saiu da lista de espera.");
  }

  return (
    <div>
      <style>{`
        .acv-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
        .acv-lista-row { display: flex; gap: 14px; align-items: center; }
        .acv-lista-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .acv-controles { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .acv-filtros { display: flex; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 600px) {
          .acv-grade { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .acv-lista-row { flex-wrap: wrap; }
          .acv-lista-meta { flex-direction: row; justify-content: space-between; width: 100%; }
          .acv-controles { flex-direction: column; }
        }
      `}</style>

      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark }}>Acervo</h1>
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2 }}>{titulos.length} título{titulos.length !== 1 ? "s" : ""} cadastrado{titulos.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            {[{ v: "grade", icon: <LayoutGrid size={16} /> }, { v: "lista", icon: <List size={16} /> }].map(({ v, icon }) => (
              <button key={v} onClick={() => setVisualizacao(v)} style={{
                padding: "7px 12px", border: "none", cursor: "pointer",
                background: visualizacao === v ? COLORS.primary : "transparent",
                color: visualizacao === v ? "#fff" : COLORS.textLight,
                display: "flex", alignItems: "center",
              }}>{icon}</button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={abrirNovoTitulo}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14 }}
            >
              <Plus size={16} /> Novo livro
            </button>
          )}
        </div>
      </div>

      {/* Busca + filtro */}
      <div className="acv-controles">
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textLight }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por título, autor, ISBN ou tombo…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bgCard, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div className="acv-filtros">
          {["Todos", "Disponível", "Indisponível"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${filtroStatus === s ? COLORS.primary : COLORS.border}`,
              background: filtroStatus === s ? COLORS.primary : "transparent",
              color: filtroStatus === s ? "#fff" : COLORS.text,
            }}>{s}</button>
          ))}
        </div>
      </div>

      {titulosFiltrados.length === 0 ? (
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <BookOpen size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: COLORS.textLight }}>
            {busca || filtroStatus !== "Todos" ? "Nenhum livro encontrado com esse filtro." : "Nenhum livro cadastrado ainda."}
          </p>
        </div>
      ) : visualizacao === "grade" ? (
        /* ── GRADE ── */
        <div className="acv-grade">
          {titulosFiltrados.map(t => {
            const stats = statsPorTitulo.get(t.id) ?? { disponiveis: 0, total: 0 };
            const meuStatus = meuStatusTitulo(t.id, stats.disponiveis);
            return (
              <div key={t.id} onClick={() => setDetalheTituloId(t.id)} style={{ cursor: "pointer", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`, flexShrink: 0, overflow: "hidden" }}>
                  {t.foto && (
                    <img src={t.foto} alt="Capa"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.currentTarget.style.display = "none"; }} />
                  )}
                  {!t.foto && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={44} color="rgba(255,255,255,0.25)" />
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 8, right: 8 }}><DisponibilidadeBadge disponiveis={stats.disponiveis} total={stats.total} /></div>
                </div>
                <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.text, lineHeight: 1.3 }}>{t.titulo}</div>
                  <div style={{ fontSize: 11, color: COLORS.textLight }}>{t.autor || "—"}</div>
                  <div style={{ display: "flex", gap: 6, fontSize: 11, color: COLORS.textLight, flexWrap: "wrap" }}>
                    {t.ano && <span>{t.ano}</span>}
                    {t.editora && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.editora}</span>}
                  </div>
                  {t.generos?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                      {t.generos.slice(0, 2).map(g => (
                        <span key={g} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: COLORS.bg, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>{g}</span>
                      ))}
                      {t.generos.length > 2 && <span style={{ fontSize: 10, color: COLORS.textLight }}>+{t.generos.length - 2}</span>}
                    </div>
                  )}
                  {meuStatus && (
                    <div style={{ marginTop: 2 }}><MeuStatusBadge tipo={meuStatus} /></div>
                  )}
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                      <button onClick={e => { e.stopPropagation(); abrirEditarTitulo(t); }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: COLORS.primary, padding: "5px 0", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "none", cursor: "pointer" }}>
                        <Edit2 size={11} /> Editar
                      </button>
                      <button onClick={e => { e.stopPropagation(); setExcluindoTitulo(t); }} disabled={exemplares.some(ex => ex.titulo_id === t.id && ex.status === "Emprestado")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: COLORS.danger, padding: "5px 0", borderRadius: 6, border: `1px solid ${COLORS.dangerLight}`, background: "none", cursor: "pointer" }}>
                        <Trash2 size={11} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LISTA ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {titulosFiltrados.map(t => {
            const stats = statsPorTitulo.get(t.id) ?? { disponiveis: 0, total: 0 };
            const meuStatus = meuStatusTitulo(t.id, stats.disponiveis);
            return (
              <div key={t.id} onClick={() => setDetalheTituloId(t.id)} className="acv-lista-row" style={{ cursor: "pointer", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ width: 48, height: 72, flexShrink: 0, borderRadius: 5, overflow: "hidden", background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {t.foto
                    ? <img src={t.foto} alt="Capa" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} />
                    : <BookOpen size={18} color="rgba(255,255,255,0.4)" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 2 }}>{t.titulo}</div>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 6 }}>
                    {[t.autor, t.editora, t.ano].filter(Boolean).join(" · ")}
                  </div>
                  {t.generos?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {t.generos.slice(0, 3).map(g => (
                        <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: COLORS.bg, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>{g}</span>
                      ))}
                      {t.generos.length > 3 && <span style={{ fontSize: 10, color: COLORS.textLight }}>+{t.generos.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="acv-lista-meta">
                  <DisponibilidadeBadge disponiveis={stats.disponiveis} total={stats.total} />
                  {meuStatus && <MeuStatusBadge tipo={meuStatus} />}
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={e => { e.stopPropagation(); abrirEditarTitulo(t); }}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.primary, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "none", cursor: "pointer" }}>
                        <Edit2 size={12} /> Editar
                      </button>
                      <button onClick={e => { e.stopPropagation(); setExcluindoTitulo(t); }}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.danger, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.dangerLight}`, background: "none", cursor: "pointer" }}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de formulário de título */}
      {form && (
        <TituloForm
          titulo={form}
          exemplar={formExemplar}
          onChangeTitulo={setForm}
          onChangeExemplar={setFormExemplar}
          onSave={salvarTitulo}
          onClose={() => setForm(null)}
          salvando={salvando}
          modoNovo={modoNovo}
        />
      )}

      {/* Modal de detalhe do título */}
      {detalheTitulo && (
        <TituloDetalheModal
          titulo={detalheTitulo}
          exemplaresDoTitulo={exemplares.filter(e => e.titulo_id === detalheTitulo.id)}
          isAdmin={isAdmin}
          minhaEmprestimoAtivo={meuEmprestimoAtivoPorTitulo.get(detalheTitulo.id)}
          minhaSolicitacaoPendente={minhasSolicitacoesPendentesPorTitulo.get(detalheTitulo.id)}
          minhaEntradaListaEspera={minhaListaEsperaPorTitulo.get(detalheTitulo.id)}
          listaEsperaDoTitulo={listaEsperaPorTitulo.get(detalheTitulo.id) ?? []}
          onClose={() => setDetalheTituloId(null)}
          onEditarExemplar={abrirEditarExemplar}
          onNovoExemplar={() => abrirNovoExemplar(detalheTitulo.id)}
          onExcluirExemplar={setExcluindoExemplar}
          onMarcarIndisponivel={setIndisponivelTarget}
          onMarcarDisponivel={marcarDisponivel}
          onSolicitarEmprestimo={() => setSolicitarTarget(detalheTitulo)}
          onCancelarSolicitacao={cancelarSolicitacao}
          onEntrarListaEspera={() => entrarListaEspera(detalheTitulo.id)}
          onSairListaEspera={sairListaEspera}
        />
      )}

      {/* Modal de exemplar */}
      {exemplarForm && (
        <ExemplarForm
          exemplar={exemplarForm.exemplar}
          onChange={ex => setExemplarForm({ ...exemplarForm, exemplar: ex })}
          onSave={salvarExemplar}
          onClose={() => setExemplarForm(null)}
          salvando={salvando}
          modoNovo={exemplarForm.modoNovo}
        />
      )}

      {/* Modal de indisponibilidade */}
      {indisponivelTarget && (
        <IndisponivelForm
          exemplar={indisponivelTarget}
          onConfirm={confirmarIndisponivel}
          onClose={() => setIndisponivelTarget(null)}
          salvando={salvando}
        />
      )}

      {/* Modal de solicitação de empréstimo */}
      {solicitarTarget && (
        <SolicitarEmprestimoModal
          titulo={solicitarTarget}
          onConfirm={solicitarEmprestimo}
          onClose={() => setSolicitarTarget(null)}
          enviando={enviando}
        />
      )}

      {/* Modal de confirmação de exclusão de título */}
      {excluindoTitulo && (
        <ConfirmModal
          mensagem={`Excluir "${excluindoTitulo.titulo}" e todos os seus exemplares? Essa ação não pode ser desfeita.`}
          onConfirm={() => excluirTitulo(excluindoTitulo.id)}
          onClose={() => setExcluindoTitulo(null)}
        />
      )}

      {/* Modal de confirmação de exclusão de exemplar */}
      {excluindoExemplar && (
        <ConfirmModal
          mensagem={`Excluir o exemplar ${excluindoExemplar.tombo ? `#${excluindoExemplar.tombo}` : ""}? Essa ação não pode ser desfeita.`}
          onConfirm={() => excluirExemplar(excluindoExemplar)}
          onClose={() => setExcluindoExemplar(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          background: toastTipo === "erro" ? COLORS.danger : COLORS.primaryDark, color: "#fff",
          padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
          maxWidth: 420,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {toastTipo === "erro" ? <X size={15} /> : <Check size={15} />} {toast}
        </div>
      )}
    </div>
  );
}
