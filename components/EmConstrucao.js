import { COLORS } from "@/lib/design";
import { Wrench } from "lucide-react";

export default function EmConstrucao({ titulo }) {
  return (
    <div>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 24 }}>
        {titulo}
      </h1>
      <div style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "48px 32px",
        textAlign: "center",
      }}>
        <Wrench size={36} color={COLORS.border} style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 15, color: COLORS.textLight, marginBottom: 8 }}>Tela em desenvolvimento</p>
        <p style={{ fontSize: 13, color: COLORS.neutralLight }}>Esta funcionalidade estará disponível em breve.</p>
      </div>
    </div>
  );
}
