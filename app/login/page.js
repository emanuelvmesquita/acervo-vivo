"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";
import { BookOpen, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    router.push("/painel");
    router.refresh();
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
        maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: COLORS.primary,
            borderRadius: 16,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}>
            <BookOpen size={32} color="#fff" />
          </div>
          <h1 style={{
            fontFamily: "'Georgia', serif",
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.primaryDark,
            letterSpacing: "-0.5px",
          }}>Acervo Vivo</h1>
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 4 }}>
            Entre na sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* E-mail */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1.5px solid ${COLORS.border}`,
                borderRadius: 8,
                fontSize: 15,
                outline: "none",
                background: COLORS.bg,
              }}
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textLight, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 14px",
                  border: `1.5px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontSize: 15,
                  outline: "none",
                  background: COLORS.bg,
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: COLORS.textLight,
                  padding: 0,
                }}
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {erro && (
            <div style={{
              background: COLORS.dangerLight,
              color: COLORS.danger,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 16,
            }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: "100%",
              padding: "12px",
              background: carregando ? COLORS.primaryLight : COLORS.primary,
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              border: "none",
              cursor: carregando ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: COLORS.textLight }}>
          Não tem conta?{" "}
          <a href="/cadastro" style={{ color: COLORS.primary, fontWeight: 600, textDecoration: "none" }}>
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
