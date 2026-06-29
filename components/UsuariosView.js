"use client";

import { useState, useMemo } from "react";
import { COLORS } from "@/lib/design";
import { Plus, Search, Edit2, Trash2, X, Check, UserCheck, UserMinus, Shield, User } from "lucide-react";

function Label({ children }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{children}</label>;
}

function Field({ label, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: disabled ? COLORS.bg : COLORS.bgCard, color: disabled ? COLORS.textLight : COLORS.text, outline: "none" }} />
    </div>
  );
}

function Avatar({ nome, size = 38 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {nome?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function UsuarioModal({ usuario, onSave, onClose, salvando, isNovo = false }) {
  const [dados, setDados] = useState({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    cpf: usuario?.cpf ?? "",
    telefone: usuario?.telefone ?? "",
    perfil: usuario?.perfil ?? "leitor",
  });

  function set(k, v) { setDados(d => ({ ...d, [k]: v })); }
  const valido = dados.nome.trim() && dados.email.trim() && dados.cpf.replace(/\D/g, "").length === 11;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 14, width: "100%", maxWidth: 500, padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
            {isNovo ? "Novo usuário" : "Editar usuário"}
          </h2>
          <button onClick={onClose} style={{ color: COLORS.textLight }}><X size={20} /></button>
        </div>

        {isNovo && (
          <div style={{ background: COLORS.successLight, border: `1px solid ${COLORS.success}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: COLORS.primaryDark, marginBottom: 18 }}>
            O usuário receberá um link para definir a própria senha no primeiro acesso.
          </div>
        )}

        <Field label="Nome completo *" value={dados.nome} onChange={v => set("nome", v)} placeholder="Nome Sobrenome" />
        <Field label="E-mail *" type="email" value={dados.email} onChange={v => set("email", v)} placeholder="email@exemplo.com" />
        <Field label="CPF *" value={dados.cpf} onChange={v => set("cpf", v.replace(/\D/g, "").slice(0, 11))} placeholder="00000000000" />
        <Field label="Telefone" value={dados.telefone ?? ""} onChange={v => set("telefone", v)} placeholder="(00) 00000-0000" />

        <div style={{ marginBottom: 20 }}>
          <Label>Perfil</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {["leitor", "administrador"].map(p => (
              <button key={p} onClick={() => set("perfil", p)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${dados.perfil === p ? COLORS.primary : COLORS.border}`,
                background: dados.perfil === p ? COLORS.primary : "transparent",
                color: dados.perfil === p ? "#fff" : COLORS.text,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {p === "administrador" ? <Shield size={14} /> : <User size={14} />}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={() => onSave(dados)} disabled={!valido || salvando}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: valido ? COLORS.primary : COLORS.border, color: valido ? "#fff" : COLORS.textLight }}>
            {salvando ? "Salvando…" : isNovo ? "Criar usuário" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ mensagem, confirmLabel, confirmColor, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: "28px", maxWidth: 360, width: "100%" }}>
        <p style={{ fontSize: 15, color: COLORS.text, marginBottom: 24 }}>{mensagem}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: confirmColor ?? COLORS.danger, color: "#fff" }}>{confirmLabel ?? "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosView({ usuariosIniciais, meId }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [novoAberto, setNovoAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtrados = useMemo(() => usuarios.filter(u => {
    const q = busca.toLowerCase();
    const matchBusca = !q || u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cpf?.includes(q);
    const matchFiltro = filtro === "Todos" || (filtro === "Ativo" && u.ativo) || (filtro === "Inativo" && !u.ativo) || (filtro === "Admin" && u.perfil === "administrador");
    return matchBusca && matchFiltro;
  }), [usuarios, busca, filtro]);

  async function criarUsuario(dados) {
    setSalvando(true);
    const res = await fetch("/api/admin/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    const json = await res.json();
    if (res.ok) {
      setUsuarios(us => [...us, json.usuario].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoAberto(false);
      showToast("Usuário criado.");
    } else {
      showToast("Erro: " + json.error);
    }
    setSalvando(false);
  }

  async function salvarEdicao(dados) {
    setSalvando(true);
    const res = await fetch("/api/admin/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editando.id, ...dados }) });
    const json = await res.json();
    if (res.ok) {
      setUsuarios(us => us.map(u => u.id === editando.id ? json.usuario : u));
      setEditando(null);
      showToast("Usuário atualizado.");
    } else {
      showToast("Erro: " + json.error);
    }
    setSalvando(false);
  }

  async function toggleAtivo(usuario) {
    const res = await fetch("/api/admin/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: usuario.id, ativo: !usuario.ativo }) });
    const json = await res.json();
    if (res.ok) {
      setUsuarios(us => us.map(u => u.id === usuario.id ? json.usuario : u));
      showToast(json.usuario.ativo ? "Usuário ativado." : "Usuário inativado.");
    }
    setConfirmacao(null);
  }

  async function excluir(id) {
    const res = await fetch("/api/admin/usuarios", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const json = await res.json();
    if (res.ok) {
      setUsuarios(us => us.filter(u => u.id !== id));
      showToast("Usuário excluído.");
    } else {
      showToast("Erro: " + json.error);
    }
    setConfirmacao(null);
  }

  const ativos = usuarios.filter(u => u.ativo).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark }}>Usuários</h1>
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2 }}>{ativos} ativo{ativos !== 1 ? "s" : ""} · {usuarios.length} total</p>
        </div>
        <button onClick={() => setNovoAberto(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: COLORS.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textLight }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou CPF…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bgCard, outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Ativo", "Inativo", "Admin"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${filtro === f ? COLORS.primary : COLORS.border}`,
              background: filtro === f ? COLORS.primary : "transparent",
              color: filtro === f ? "#fff" : COLORS.text,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.length === 0 ? (
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: COLORS.textLight }}>Nenhum usuário encontrado.</p>
          </div>
        ) : filtrados.map(u => (
          <div key={u.id} style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10,
            padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
            opacity: u.ativo ? 1 : 0.6,
          }}>
            <Avatar nome={u.nome} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{u.nome}</span>
                {u.perfil === "administrador" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: COLORS.accent, background: "#FEF9C3", padding: "1px 8px", borderRadius: 10 }}>
                    <Shield size={10} /> Admin
                  </span>
                )}
                {!u.ativo && <span style={{ fontSize: 11, color: COLORS.textLight, background: COLORS.bg, padding: "1px 8px", borderRadius: 10, border: `1px solid ${COLORS.border}` }}>Inativo</span>}
                {u.pending_senha && <span style={{ fontSize: 11, color: COLORS.warn, background: COLORS.warnLight, padding: "1px 8px", borderRadius: 10 }}>Aguardando senha</span>}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
                {u.email}{u.cpf ? ` · CPF ${u.cpf}` : ""}
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setEditando(u)} title="Editar"
                style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${COLORS.border}`, color: COLORS.primary, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Edit2 size={13} />
              </button>
              {u.id !== meId && (
                <>
                  <button
                    onClick={() => setConfirmacao({ tipo: "toggle", usuario: u })}
                    title={u.ativo ? "Inativar" : "Ativar"}
                    style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${COLORS.border}`, color: u.ativo ? COLORS.warn : COLORS.success, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    {u.ativo ? <UserMinus size={13} /> : <UserCheck size={13} />}
                  </button>
                  <button onClick={() => setConfirmacao({ tipo: "excluir", usuario: u })} title="Excluir"
                    style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${COLORS.dangerLight}`, color: COLORS.danger, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modais */}
      {novoAberto && <UsuarioModal isNovo onSave={criarUsuario} onClose={() => setNovoAberto(false)} salvando={salvando} />}
      {editando && <UsuarioModal usuario={editando} onSave={salvarEdicao} onClose={() => setEditando(null)} salvando={salvando} />}

      {confirmacao?.tipo === "toggle" && (
        <ConfirmModal
          mensagem={confirmacao.usuario.ativo ? `Inativar "${confirmacao.usuario.nome}"? O usuário não conseguirá mais logar.` : `Reativar "${confirmacao.usuario.nome}"?`}
          confirmLabel={confirmacao.usuario.ativo ? "Inativar" : "Ativar"}
          confirmColor={confirmacao.usuario.ativo ? COLORS.warn : COLORS.success}
          onConfirm={() => toggleAtivo(confirmacao.usuario)}
          onClose={() => setConfirmacao(null)}
        />
      )}
      {confirmacao?.tipo === "excluir" && (
        <ConfirmModal
          mensagem={`Excluir permanentemente "${confirmacao.usuario.nome}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => excluir(confirmacao.usuario.id)}
          onClose={() => setConfirmacao(null)}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, background: COLORS.primaryDark, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
