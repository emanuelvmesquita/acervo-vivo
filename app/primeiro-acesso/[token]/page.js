"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";

function senhaForte(s) {
  return {
    min8: s.length >= 8,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    digit: /[0-9]/.test(s),
    special: /[^A-Za-z0-9]/.test(s),
  };
}

const CRITERIOS = [
  { key: "min8", label: "Mínimo 8 caracteres" },
  { key: "upper", label: "Uma letra maiúscula" },
  { key: "lower", label: "Uma letra minúscula" },
  { key: "digit", label: "Um número" },
  { key: "special", label: "Um caractere especial (!@#$…)" },
];

export default function PrimeiroAcessoPage() {
  const { token } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [loading, setLoading] = useState(true);

  const forca = senhaForte(senha);
  const tudo = Object.values(forca).every(Boolean);

  useEffect(() => {
    async function buscarPerfil() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, pending_senha, token_senha")
        .eq("token_senha", token)
        .eq("pending_senha", true)
        .single();

      if (error || !data) {
        setErro("Link inválido ou já utilizado.");
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    buscarPerfil();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tudo) { setErro("A senha não atende todos os critérios."); return; }
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    setErro("");
    setCarregando(true);

    // Admin updates the user's password via service route
    const res = await fetch("/api/primeiro-acesso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha }),
    });

    const json = await res.json();
    if (!res.ok) {
      setErro(json.error || "Erro ao definir senha.");
      setCarregando(false);
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  const barColor = () => {
    const n = Object.values(forca).filter(Boolean).length;
    if (n <= 1) return COLORS.danger;
    if (n <= 3) return COLORS.warn;
    return COLORS.success;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)` }}>
        <p style={{ color: "#fff", fontSize: 15 }}>Verificando link…</p>
      </div>
    );
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
        padding: "40px 36px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56,
            height: 56,
            background: COLORS.primary,
            borderRadius: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}>
            <BookOpen size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark }}>
            Acervo Vivo
          </h1>
          {profile ? (
            <p style={{ fontSize: 14, color: COLORS.textLight, marginTop: 4 }}>
              Olá, <strong style={{ color: COLORS.text }}>{profile.nome.split(" ")[0]}</strong>! Crie sua senha de acesso.
            </p>
          ) : (
            <p style={{ fontSize: 14, color: COLORS.danger, marginTop: 4 }}>{erro}</p>
          )}
        </div>

        {sucesso ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle2 size={48} color={COLORS.success} style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: COLORS.success, fontSize: 16 }}>Senha definida com sucesso!</p>
            <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 8 }}>Redirecionando para o login…</p>
          </div>
        ) : profile ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Nova senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 15, background: COLORS.bg, outline: "none" }}
              />
              {/* Barra de força */}
              {senha.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: Object.values(forca).filter(Boolean).length >= i ? barColor() : COLORS.border,
                      transition: "background 0.2s",
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Critérios */}
            {senha.length > 0 && (
              <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                {CRITERIOS.map(c => (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 13 }}>
                    {forca[c.key]
                      ? <CheckCircle2 size={14} color={COLORS.success} />
                      : <XCircle size={14} color={COLORS.textLight} />}
                    <span style={{ color: forca[c.key] ? COLORS.success : COLORS.textLight }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${confirmar && confirmar !== senha ? COLORS.danger : COLORS.border}`, borderRadius: 8, fontSize: 15, background: COLORS.bg, outline: "none" }}
              />
            </div>

            {erro && (
              <div style={{ background: COLORS.dangerLight, color: COLORS.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !tudo}
              style={{
                width: "100%",
                padding: "12px",
                background: tudo ? COLORS.primary : COLORS.border,
                color: tudo ? "#fff" : COLORS.textLight,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                cursor: tudo ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              {carregando ? "Salvando…" : "Definir senha e entrar"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
