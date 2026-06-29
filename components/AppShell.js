"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, BookCopy, RefreshCw, Bell,
  PenLine, Heart, Users, Settings, UsersRound,
  LogOut, Menu, X, Bookmark,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/design";

const NAV_ITEMS = [
  { href: "/painel",        label: "Painel",           icon: LayoutDashboard },
  { href: "/acervo",        label: "Acervo",           icon: BookOpen },
  { href: "/emprestimos",   label: "Empréstimos",      icon: BookCopy },
  { href: "/renovacoes",    label: "Renovações",       icon: RefreshCw },
  { href: "/notificacoes",  label: "Notificações",     icon: Bell },
  { href: "/minhabiblioteca", label: "Minha Biblioteca", icon: Bookmark },
  { href: "/anotacoes",     label: "Anotações",        icon: PenLine },
  { href: "/desejos",       label: "Lista de Desejos", icon: Heart },
  { href: "/comunidade",    label: "Comunidade",       icon: Users },
];

const ADMIN_ITEMS = [
  { href: "/usuarios",  label: "Usuários",  icon: UsersRound },
  { href: "/config",    label: "Config",    icon: Settings },
];

function NavLink({ href, label, icon: Icon, onClick }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/painel" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px",
        borderRadius: 8,
        color: active ? "#fff" : COLORS.sidebarText,
        background: active ? COLORS.sidebarActive : "transparent",
        fontWeight: active ? 600 : 400,
        fontSize: 14,
        transition: "all 0.15s",
        marginBottom: 2,
      }}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

export default function AppShell({ profile, children }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.perfil === "administrador";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const closeMobile = () => setMobileOpen(false);

  const sidebar = (
    <nav style={{
      width: 220,
      minWidth: 220,
      background: COLORS.sidebar,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "24px 12px 16px",
    }}>
      {/* Brand */}
      <div style={{ paddingLeft: 8, marginBottom: 28 }}>
        <span style={{
          fontFamily: "'Georgia', serif",
          fontSize: 18,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.3px",
        }}>Acervo Vivo</span>
      </div>

      {/* Main nav */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.href} {...item} onClick={closeMobile} />
        ))}

        {isAdmin && (
          <>
            <div style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.neutralLight,
              padding: "16px 8px 8px",
            }}>
              Administração
            </div>
            {ADMIN_ITEMS.map(item => (
              <NavLink key={item.href} {...item} onClick={closeMobile} />
            ))}
          </>
        )}
      </div>

      {/* User + logout */}
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: 16, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8, marginBottom: 12 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: COLORS.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}>
            {profile?.nome?.[0] ?? "?"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile?.nome?.split(" ")[0] ?? ""}
            </div>
            <div style={{ fontSize: 11, color: COLORS.sidebarText, textTransform: "capitalize" }}>
              {profile?.perfil}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 16px",
            borderRadius: 8,
            color: COLORS.sidebarText,
            fontSize: 13,
            transition: "all 0.15s",
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </nav>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <div style={{ display: "none", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 }}
        className="sidebar-desktop">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        position: "fixed",
        top: 0,
        left: mobileOpen ? 0 : -240,
        bottom: 0,
        width: 220,
        zIndex: 50,
        transition: "left 0.25s",
      }}>
        {sidebar}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: COLORS.sidebar,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>
          <button onClick={() => setMobileOpen(v => !v)} style={{ color: "#fff", padding: 4 }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
            Acervo Vivo
          </span>
          <div style={{ width: 30 }} />
        </header>

        <main style={{ flex: 1, padding: "20px 16px", width: "100%", minWidth: 0 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: block !important; }
          header { display: none !important; }
          main {
            margin-left: 220px;
            padding: 32px 40px;
            max-width: calc(1200px + 220px);
          }
        }
      `}</style>
    </div>
  );
}
