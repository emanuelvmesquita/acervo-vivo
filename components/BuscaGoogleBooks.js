"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { COLORS } from "@/lib/design";

export default function BuscaGoogleBooks({ onPreencher }) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [erroApi, setErroApi] = useState("");

  async function buscar() {
    const q = query.trim();
    if (!q) return;
    setBuscando(true);
    setAberto(true);
    setErroApi("");
    try {
      const digitos = q.replace(/[-\s]/g, "");
      const isIsbn = /^\d{10,13}$/.test(digitos);
      const term = isIsbn ? `isbn:${digitos}` : q;
      const res = await fetch(`/api/google-books?q=${encodeURIComponent(term)}`);
      const json = await res.json();
      if (!res.ok) {
        setErroApi(json.error ?? "Erro ao buscar.");
        setResultados([]);
      } else {
        setResultados(json.items ?? []);
      }
    } catch (err) {
      setErroApi(err.message ?? "Erro de rede.");
      setResultados([]);
    }
    setBuscando(false);
  }

  function selecionar(item) {
    const info = item.volumeInfo ?? {};
    const isbn =
      info.industryIdentifiers?.find(i => i.type === "ISBN_13")?.identifier ??
      info.industryIdentifiers?.find(i => i.type === "ISBN_10")?.identifier ?? "";
    onPreencher({
      titulo: info.title ?? "",
      autor: info.authors?.[0] ?? "",
      editora: info.publisher ?? "",
      ano: info.publishedDate?.slice(0, 4) ?? "",
      isbn,
      paginas: info.pageCount ? String(info.pageCount) : "",
      foto: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? "",
    });
    setQuery("");
    setResultados([]);
    setAberto(false);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Buscar no Google Books
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
          placeholder="Título, autor ou ISBN…"
          style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, background: COLORS.bg, outline: "none" }}
        />
        <button
          onClick={buscar}
          disabled={buscando || !query.trim()}
          style={{
            padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: query.trim() ? COLORS.primary : COLORS.border,
            color: "#fff", whiteSpace: "nowrap",
          }}
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {aberto && (
        <div style={{ marginTop: 6, border: `1.5px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.bgCard, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          {buscando ? (
            <p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: COLORS.textLight }}>Buscando…</p>
          ) : erroApi ? (
            <p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: COLORS.danger }}>{erroApi}</p>
          ) : resultados.length === 0 ? (
            <p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: COLORS.textLight }}>Nenhum resultado encontrado.</p>
          ) : (
            resultados.map(item => {
              const info = item.volumeInfo ?? {};
              const thumb = info.imageLinks?.smallThumbnail?.replace("http://", "https://");
              return (
                <button
                  key={item.id}
                  onClick={() => selecionar(item)}
                  style={{
                    width: "100%", display: "flex", gap: 12, alignItems: "center",
                    padding: "10px 14px", background: "none", border: "none",
                    borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  {thumb ? (
                    <img src={thumb} alt="" style={{ width: 36, height: 50, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 50, background: COLORS.bg, borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={16} color={COLORS.border} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {info.title}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {info.authors?.join(", ") ?? "Autor desconhecido"}
                      {info.publishedDate ? ` · ${info.publishedDate.slice(0, 4)}` : ""}
                    </p>
                    {info.publisher && (
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: COLORS.textLight }}>{info.publisher}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
          <button
            onClick={() => setAberto(false)}
            style={{ width: "100%", padding: "8px", fontSize: 12, color: COLORS.textLight, background: "none", border: "none", cursor: "pointer" }}
          >
            Fechar
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 4px" }}>
        <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        <span style={{ fontSize: 11, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.08em" }}>ou preencha manualmente</span>
        <div style={{ flex: 1, height: 1, background: COLORS.border }} />
      </div>
    </div>
  );
}
