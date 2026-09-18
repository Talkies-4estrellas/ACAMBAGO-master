"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut, Store, User, Plus, Check } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import { getDemoMode, stopDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/client";
import { loadOwnedBusinesses, setCurrentBusinessId } from "@/lib/current-business";
import { Business } from "@/types";
import { useClerk } from "@clerk/nextjs";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { userId, name, role, hasBusiness, loading } = useAuthUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const user = userId ? { id: userId } : null;
  // hasBusiness cubre tiendas pendientes de aprobación (rol todavía
  // "client"), no solo las ya aprobadas ("business"). Se excluye admin: un
  // admin que también sea dueño de una tienda sigue viendo "Mi panel", no
  // el switcher de vendedor.
  const actingAsSeller = role !== "admin" && (role === "business" || hasBusiness);

  const handleLogout = async () => {
    if (getDemoMode()) { stopDemoMode(); return; }
    await signOut();
    setMenuOpen(false);
    router.push("/");
  };

  const dashboardHref = role === "admin" ? "/admin" : "/dashboard/business";

  useEffect(() => {
    if (!actingAsSeller || !userId || getDemoMode()) return;
    const supabase = createClient();
    loadOwnedBusinesses(supabase, userId).then(({ businesses, active }) => {
      setBusinesses(businesses);
      setActiveBusinessId(active?.id ?? null);
    });
  }, [actingAsSeller, userId]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  // El header cambia ligeramente de color/sombra al hacer scroll.
  useEffect(() => {
    const onWindowScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, []);

  const switchStore = (id: string) => {
    setMenuOpen(false);
    if (id === activeBusinessId) {
      router.push("/dashboard/business");
      return;
    }
    setCurrentBusinessId(id);
    // Recarga completa (no solo navegación) para que todas las páginas del
    // panel vuelvan a pedir datos con la tienda nueva, igual que el switcher
    // de escritorio en UserInfo.tsx.
    window.location.assign("/dashboard/business");
  };

  return (
    <nav
      ref={navRef}
      className={`md:hidden sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled
          ? "bg-white/95 border-slate-200 shadow-md dark:bg-[#050e18]/90 dark:border-white/15"
          : "bg-white/90 border-slate-200 shadow-sm dark:bg-[#050e18]/75 dark:border-white/10 dark:shadow-none"
      }`}
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="h-10 bg-white rounded-xl px-2.5 flex items-center shadow-sm">
              <Image src="/acomdi.png" alt="Acom-Di" width={80} height={32} className="h-8 w-auto object-contain" priority />
            </div>
          </Link>

          {/* Mobile: theme + notificaciones + hamburger (el carrito ya vive en la barra inferior) */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user && <NotificationBell href={actingAsSeller ? "/dashboard/business/notificaciones" : "/perfil/notificaciones"} />}
            <button
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen
                ? <X className="w-5 h-5 text-slate-600 dark:text-gray-200" />
                : <Menu className="w-5 h-5 text-slate-600 dark:text-gray-200" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 dark:border-white/10 py-4 px-4 flex flex-col gap-2 bg-white dark:bg-[#050e18]/95">
          <Link href="/" className="text-sm font-medium py-2.5 px-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link href="/productos" className="text-sm font-medium py-2.5 px-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10" onClick={() => setMenuOpen(false)}>Productos</Link>
          <Link href="/#categorias" className="text-sm font-medium py-2.5 px-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10" onClick={() => setMenuOpen(false)}>Categorías</Link>
          <Link href="/map" className="text-sm font-medium py-2.5 px-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10" onClick={() => setMenuOpen(false)}>Mapa</Link>
          <Link href="/coupons" className="text-sm font-medium py-2.5 px-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10" onClick={() => setMenuOpen(false)}>Cupones</Link>

          <hr className="border-slate-200 dark:border-white/10 my-1" />

          {!loading && (
            user ? (
              <>
                {/* Info usuario */}
                <Link
                  href="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                    {actingAsSeller
                      ? <Store className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      : <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{name ?? "Usuario"}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{role ?? "usuario"}</p>
                  </div>
                </Link>

                {actingAsSeller && businesses.length > 0 && (
                  <div className="px-1">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 px-2 pt-1 pb-1">Cambiar de tienda</p>
                    {businesses.map((b) => {
                      const isActive = b.id === activeBusinessId;
                      return (
                        <button
                          key={b.id}
                          onClick={() => switchStore(b.id)}
                          className={`flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-sm transition-colors ${
                            isActive
                              ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold"
                              : "text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/10"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0 relative">
                            {b.image_url ? (
                              <Image src={b.image_url} alt={b.name} fill className="object-cover" />
                            ) : (
                              <Store className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                            )}
                          </div>
                          <span className="truncate flex-1 text-left">{b.name}</span>
                          {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                    <Link
                      href="/perfil/crear-tienda"
                      className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Plus className="w-3.5 h-3.5 flex-shrink-0" /> Agregar otra tienda
                    </Link>
                    {/* Una sucursal solo tiene sentido para una tienda ya
                        aprobada (comparte productos/cupones con ella). */}
                    {businesses.find((b) => b.id === activeBusinessId)?.is_approved && (
                      <Link
                        href="/perfil/crear-sucursal"
                        className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" /> Agregar nueva sucursal
                      </Link>
                    )}
                  </div>
                )}

                {(role === "admin" || actingAsSeller) && (
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Mi panel
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 py-2.5 border border-slate-300 dark:border-white/20 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" /> Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserPlus className="w-4 h-4" /> Registrarse
                </Link>
              </>
            )
          )}
        </div>
      )}
    </nav>
  );
}
