"use client";

import { COLORS } from "@/lib/design";
import { AlertTriangle, Clock, BookOpen } from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(isoA, isoB) {
  return Math.round((new Date(isoB + "T00:00:00") - new Date(isoA + "T00:00:00")) / 86400000);
}

function diaSemanaCurto(iso) {
  const dias = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  return dias[new Date(iso + "T00:00:00").getDay()];
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 11, color: COLORS.textLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || COLORS.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function PainelView({ profile, isAdmin, livros, emprestimos, renovacoes, totalUsuarios, leituras }) {
  const today = todayISO();

  if (isAdmin) {
    const ativos = emprestimos.filter(e => e.status !== "Devolvido");
    const atrasados = ativos.filter(e => e.data_devolucao < today);
    const emDia = ativos.filter(e => e.data_devolucao >= today);

    const devolvidos = emprestimos.filter(e => e.data_devolvido && e.data_devolucao_efetiva);
    const noPrazo = devolvidos.filter(e => e.data_devolucao_efetiva <= e.data_devolucao).length;
    const taxaNoPrazo = devolvidos.length > 0 ? Math.round((noPrazo / devolvidos.length) * 100) : 0;

    const sete = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const novos = livros.filter(l => l.created_at?.slice(0, 10) >= sete).length;

    const duracaoMedia = devolvidos.length > 0
      ? Math.round(devolvidos.reduce((s, e) => s + diffDays(e.data_emprestimo, e.data_devolucao_efetiva), 0) / devolvidos.length)
      : 0;

    // Top leitores
    const contagemLocatario = {};
    emprestimos.forEach(e => {
      contagemLocatario[e.locatario] = (contagemLocatario[e.locatario] || 0) + 1;
    });
    const topLeitores = Object.entries(contagemLocatario)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top livros
    const contagemLivro = {};
    emprestimos.forEach(e => {
      if (e.livro_id) contagemLivro[e.livro_id] = (contagemLivro[e.livro_id] || 0) + 1;
    });
    const topLivroIds = Object.entries(contagemLivro)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => ({ id, n, titulo: livros.find(l => l.id === id)?.titulo ?? "—" }));

    const semPendencias = atrasados.length === 0 && renovacoes.length === 0;

    return (
      <div>
        <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 4 }}>
          {semPendencias ? "Tudo em dia" : atrasados.length > 0 ? `${atrasados.length} atraso${atrasados.length > 1 ? "s" : ""}` : `${renovacoes.length} renovação${renovacoes.length > 1 ? "ões" : ""} pendente${renovacoes.length > 1 ? "s" : ""}`}
        </h1>
        <p style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 24 }}>Painel do administrador</p>

        {/* Atrasados */}
        {atrasados.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Atrasados</div>
            {atrasados.sort((a, b) => diffDays(b.data_devolucao, today) - diffDays(a.data_devolucao, today)).map(e => (
              <div key={e.id} style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${COLORS.danger}`,
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.locatario}</div>
                  <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 2 }}>
                    <AlertTriangle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {diffDays(e.data_devolucao, today)} dias em atraso
                  </div>
                </div>
                <a href={`/emprestimos?id=${e.id}`} style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.primary,
                  background: COLORS.successLight,
                  padding: "5px 12px",
                  borderRadius: 6,
                }}>Ver</a>
              </div>
            ))}
          </section>
        )}

        {/* Renovações */}
        {renovacoes.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Renovações pendentes</div>
            {renovacoes.map(r => (
              <div key={r.id} style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${COLORS.neutralLight}`,
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.locatario}</div>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
                    <Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Solicitada em {new Date(r.data_solicitacao).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <a href={`/renovacoes?id=${r.id}`} style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.primary,
                  background: COLORS.successLight,
                  padding: "5px 12px",
                  borderRadius: 6,
                }}>Avaliar</a>
              </div>
            ))}
          </section>
        )}

        {/* Visão geral */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Visão geral do acervo</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <MetricCard label="Acervo" value={livros.length} sub="títulos" />
            <MetricCard label="Em dia" value={`${emDia.length > 0 ? Math.round((emDia.length / (emDia.length + atrasados.length)) * 100) : 100}%`} sub="empréstimos ativos" />
            <MetricCard label="Novos (7d)" value={`+${novos}`} sub="títulos adicionados" color={COLORS.primary} />
          </div>
        </section>

        {/* Empréstimos e leitores */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Empréstimos e leitores</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            <MetricCard label="Total" value={emprestimos.length} sub="empréstimos" />
            <MetricCard label="Duração média" value={`${duracaoMedia}d`} sub="por empréstimo" />
            <MetricCard label="No prazo" value={`${taxaNoPrazo}%`} sub="devoluções" color={taxaNoPrazo >= 80 ? COLORS.success : COLORS.warn} />
            <MetricCard label="Leitores" value={totalUsuarios} sub="usuários ativos" />
          </div>
        </section>

        {/* Rankings */}
        {topLeitores.length > 0 && (
          <section style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Top leitores</div>
              {topLeitores.map(([nome, n], i) => (
                <div key={nome} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: COLORS.textLight, width: 16, textAlign: "right" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{nome}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{n}</span>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Top livros</div>
              {topLivroIds.map(({ id, titulo, n }, i) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: COLORS.textLight, width: 16, textAlign: "right" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titulo}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{n}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Leitor view
  const meuNome = profile?.nome?.split(" ")[0] ?? "";
  const meusEmprestimos = emprestimos.filter(e =>
    e.locatario?.toLowerCase().includes(meuNome.toLowerCase()) && e.status !== "Devolvido"
  );

  const proximo = meusEmprestimos
    .filter(e => e.data_devolucao)
    .sort((a, b) => a.data_devolucao.localeCompare(b.data_devolucao))[0];

  const diasProximo = proximo ? diffDays(today, proximo.data_devolucao) : null;

  const headingLeitor = () => {
    if (!proximo) return `Olá, ${meuNome}`;
    if (diasProximo > 0) return `Devolver em ${diasProximo} dia${diasProximo > 1 ? "s" : ""} — ${diaSemanaCurto(proximo.data_devolucao)}`;
    if (diasProximo === 0) return "Devolução é hoje";
    return `Atrasado há ${Math.abs(diasProximo)} dia${Math.abs(diasProximo) > 1 ? "s" : ""}`;
  };

  const headingColor = () => {
    if (!proximo || diasProximo > 2) return COLORS.primaryDark;
    if (diasProximo >= 0) return COLORS.warn;
    return COLORS.danger;
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: headingColor(), marginBottom: 4 }}>
        {headingLeitor()}
      </h1>
      <p style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 24 }}>Meus empréstimos ativos</p>

      {meusEmprestimos.length === 0 ? (
        <div style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "40px 24px",
          textAlign: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: `${COLORS.primary}15`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 18,
          }}>
            <BookOpen size={34} color={COLORS.primary} />
          </div>
          <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16, color: COLORS.text, fontFamily: "'Georgia', serif" }}>
            Nenhum empréstimo ativo
          </p>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: COLORS.textLight, lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
            Explore o acervo da biblioteca e retire um livro para começar a sua leitura.
          </p>
          <a href="/acervo" style={{
            display: "inline-block",
            background: COLORS.primary, color: "#fff",
            padding: "11px 28px", borderRadius: 8,
            fontWeight: 600, fontSize: 14, textDecoration: "none",
            transition: "opacity 0.15s",
          }}>
            Ver acervo
          </a>
        </div>
      ) : (
        meusEmprestimos.map(e => {
          const dias = diffDays(today, e.data_devolucao);
          const cor = dias < 0 ? COLORS.danger : dias <= 2 ? COLORS.warn : COLORS.success;
          return (
            <div key={e.id} style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `4px solid ${cor}`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 10,
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{livros.find(l => l.id === e.livro_id)?.titulo ?? "Livro"}</div>
              <div style={{ fontSize: 12, color: dias < 0 ? COLORS.danger : COLORS.textLight, marginTop: 4 }}>
                {dias < 0 ? `Atrasado há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}` : dias === 0 ? "Vence hoje" : `Vence em ${dias} dia${dias > 1 ? "s" : ""} — ${new Date(e.data_devolucao + "T00:00:00").toLocaleDateString("pt-BR")}`}
              </div>
            </div>
          );
        })
      )}

      {leituras.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Continue lendo</div>
          {leituras.filter(l => l.progresso > 0 && l.progresso < 100).slice(0, 3).map(l => (
            <div key={l.id} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{l.livros?.titulo}</div>
              <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 8 }}>{l.livros?.autor}</div>
              <div style={{ background: COLORS.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ background: COLORS.primary, width: `${l.progresso}%`, height: "100%", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4 }}>{l.progresso}% lido</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
