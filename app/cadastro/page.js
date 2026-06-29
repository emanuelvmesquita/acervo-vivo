"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import { BookOpen, Eye, EyeOff } from "lucide-react";

const CRITERIOS = [
  { label: "Mínimo 8 caracteres",      ok: s => s.length >= 8 },
  { label: "Letra maiúscula (A–Z)",     ok: s => /[A-Z]/.test(s) },
  { label: "Letra minúscula (a–z)",     ok: s => /[a-z]/.test(s) },
  { label: "Número (0–9)",              ok: s => /[0-9]/.test(s) },
  { label: "Caractere especial (!@#…)", ok: s => /[^A-Za-z0-9]/.test(s) },
];

function forcaSenha(s) {
  return CRITERIOS.filter(c => c.ok(s)).length;
}

function mascaraCPF(v) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraTelefone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
}

const COR_FORCA = ["#E74C3C", "#E67E22", "#F1C40F", "#2ECC71", "#27AE60"];
const LABEL_FORCA = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];

export default function CadastroPage() {
  const [form, setForm] = useState({ nome: "", email: "", cpf: "", telefone: "", senha: "", confirma: "" });
  const [mostraSenha, setMostraSenha] = useState(false);
  const [mostraConfirma, setMostraConfirma] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const forca = forcaSenha(form.senha);
  const senhaValida = forca === 5;
  const confirmaValida = form.senha === form.confirma && form.confirma.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!senhaValida) { setErro("A senha não atende a todos os requisitos."); return; }
    if (!confirmaValida) { setErro("As senhas não coincidem."); return; }
    if (form.cpf.replace(/\D/g, "").length !== 11) { setErro("CPF inválido."); return; }

    setCarregando(true);

    try {
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          cpf: form.cpf,
          telefone: form.telefone,
          senha: form.senha,
        }),
      });

      let json = {};
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        json = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Resposta inesperada do servidor (${res.status}): ${text.slice(0, 120)}`);
      }

      if (!res.ok) {
        setErro(json.error ?? "Erro ao criar conta.");
        setCarregando(false);
        return;
      }

      // Login automático após cadastro
      const supabase = createClient();
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.senha,
      });

      if (loginErr) {
        // Conta criada mas login falhou — redireciona para login manual
        window.location.href = "/login";
        return;
      }

      // Reload completo garante que o cookie de sessão seja lido pelo proxy
      window.location.href = "/painel";
    } catch (err) {
      setErro(err?.message ?? "Erro inesperado. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
      padding: 16,
    }}>
      <div style={{
        background: COLORS.bgCard,
        borderRadius: 16,
        padding: "36px 32px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: COLORS.primary, borderRadius: 14,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 12,
          }}>
            <BookOpen size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 700,
            color: COLORS.primaryDark, letterSpacing: "-0.5px", margin: 0 }}>
            Acervo Vivo
          </h1>
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 4 }}>Crie sua conta de leitor</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nome */}
          <Campo label="Nome completo">
            <input value={form.nome} onChange={e => set("nome", e.target.value)}
              required placeholder="Seu nome completo" autoComplete="name" style={inputStyle} />
          </Campo>

          {/* E-mail */}
          <Campo label="E-mail">
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              required placeholder="seu@email.com" autoComplete="email" style={inputStyle} />
          </Campo>

          {/* CPF + Telefone lado a lado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Campo label="CPF">
              <input value={form.cpf}
                onChange={e => set("cpf", mascaraCPF(e.target.value))}
                required placeholder="000.000.000-00" inputMode="numeric" style={inputStyle} />
            </Campo>
            <Campo label="Telefone">
              <input value={form.telefone}
                onChange={e => set("telefone", mascaraTelefone(e.target.value))}
                placeholder="(00) 00000-0000" inputMode="numeric" style={inputStyle} />
            </Campo>
          </div>

          {/* Senha */}
          <Campo label="Senha">
            <div style={{ position: "relative" }}>
              <input type={mostraSenha ? "text" : "password"}
                value={form.senha} onChange={e => set("senha", e.target.value)}
                required autoComplete="new-password" placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 40 }} />
              <BtnOlho mostrar={mostraSenha} toggle={() => setMostraSenha(v => !v)} />
            </div>

            {/* Barra de força */}
            {form.senha.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= forca ? COR_FORCA[forca - 1] : COLORS.border,
                      transition: "background 0.2s",
                    }} />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: COR_FORCA[forca - 1] ?? COLORS.textLight }}>
                  {LABEL_FORCA[forca - 1] ?? ""}
                </p>
              </div>
            )}

            {/* Critérios */}
            {form.senha.length > 0 && (
              <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                {CRITERIOS.map(c => (
                  <li key={c.label} style={{ display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12, color: c.ok(form.senha) ? COLORS.success : COLORS.textLight }}>
                    <span style={{ fontSize: 10 }}>{c.ok(form.senha) ? "✓" : "○"}</span>
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </Campo>

          {/* Confirmar senha */}
          <Campo label="Confirmar senha">
            <div style={{ position: "relative" }}>
              <input type={mostraConfirma ? "text" : "password"}
                value={form.confirma} onChange={e => set("confirma", e.target.value)}
                required autoComplete="new-password" placeholder="••••••••"
                style={{
                  ...inputStyle, paddingRight: 40,
                  borderColor: form.confirma.length > 0
                    ? (confirmaValida ? COLORS.success : COLORS.danger)
                    : COLORS.border,
                }} />
              <BtnOlho mostrar={mostraConfirma} toggle={() => setMostraConfirma(v => !v)} />
            </div>
            {form.confirma.length > 0 && !confirmaValida && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.danger }}>As senhas não coincidem.</p>
            )}
          </Campo>

          {erro && (
            <div style={{
              background: COLORS.dangerLight, color: COLORS.danger,
              borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16,
            }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={carregando} style={{
            width: "100%", padding: "12px",
            background: carregando ? COLORS.primaryLight : COLORS.primary,
            color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 15,
            border: "none", cursor: carregando ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}>
            {carregando ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: COLORS.textLight }}>
          Já tem conta?{" "}
          <a href="/login" style={{ color: COLORS.primary, fontWeight: 600, textDecoration: "none" }}>
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600,
        color: COLORS.textLight, marginBottom: 6,
        letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function BtnOlho({ mostrar, toggle }) {
  return (
    <button type="button" onClick={toggle} style={{
      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", color: COLORS.textLight, padding: 0,
    }}>
      {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
  fontSize: 14, outline: "none", background: COLORS.bg,
  boxSizing: "border-box", fontFamily: "inherit",
};
