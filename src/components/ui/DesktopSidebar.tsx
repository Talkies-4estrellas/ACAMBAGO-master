"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Tag, LayoutGrid, Map, Ticket, ShoppingCart, LogIn, UserPlus, LayoutDashboard, LogOut, Store, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AccountModeSwitcher from "./AccountModeSwitcher";
import NotificationBell from "./NotificationBell";
import { useCart } from "@/lib/cart-context";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import { getDemoMode, stopDemoMode } from "@/lib/demo-mode";
import { useClerk } from "@clerk/nextjs";

const navItems = [
  { href: "/",            label: "Inicio",     icon: Home,       exact: true  },
  { href: "/productos",   label: "Productos",  icon: Tag,        exact: false },
  { href: "/#categorias", label: "Categorías", icon: LayoutGrid, exact: false },
  { href: "/map",         label: "Mapa",       icon: Map,        exact: false },
  { href: "/coupons",     label: "Cupones",    icon: Ticket,     exact: false },
];

export default function DesktopSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, openCart } = useCart();
  const { userId, name, role, loading } = useAuthUser();
  const { signOut } = useClerk();
  const user = userId ? { id: userId } : null;
  const inStore = pathname.startsWith("/dashboard");

  const handleLogout = async () => {
    if (getDemoMode()) { stopDemoMode(); return; }
    await signOut();
    router.push("/");
  };

  return (
    <aside
      className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 bg-white/90 dark:bg-[#050e18]/90 backdrop-blur-md border-r border-slate-200 dark:border-white/10 transition-[width] duration-200 overflow-hidden ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className={`p-3 border-b border-slate-200 dark:border-white/10 flex ${collapsed ? "flex-col items-center gap-2" : "items-center justify-between p-5"}`}>
        <Link href="/" className="flex items-center flex-shrink-0" title="Inicio">
          <div className={`bg-white rounded-xl flex items-center justify-center shadow-sm ${collapsed ? "h-11 w-11" : "h-10 px-3"}`}>
            <Image src="/acomdi.png" alt="Acom-Di" width={collapsed ? 36 : 80} height={32} className={collapsed ? "h-7 w-auto object-contain" : "h-8 w-auto object-contain"} priority />
          </div>
        </Link>
        {user && role === "business" && <NotificationBell href="/dashboard/business/notificaciones" />}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === "/"
            : pathname === href.split("#")[0] && href.split("#")[0] !== "/";
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${collapsed ? "justify-center" : ""} ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-white/10 space-y-1">
        {/* Carrito */}
        <button
          onClick={openCart}
          title="Carrito"
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <div className="relative flex-shrink-0">
            <ShoppingCart className="w-5 h-5" />
            {collapsed && count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-brand-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </div>
          {!collapsed && (
            <>
              Carrito
              {count > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </>
          )}
        </button>

        {!loading && (
          user ? (
            /* Usuario logueado */
            <>
              {/* Info del usuario */}
              <Link
                href="/perfil"
                title="Ver mi perfil"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${collapsed ? "justify-center" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  {role === "business"
                    ? <Store className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    : <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  }
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{name ?? "Usuario"}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{role ?? "usuario"}</p>
                  </div>
                )}
              </Link>

              {/* Selector Mi cuenta / Mi tienda (solo para vendedores) */}
              {role === "business" ? (
                collapsed ? (
                  <div className="grid grid-cols-1 gap-1">
                    <Link
                      href="/perfil"
                      title="Mi cuenta"
                      className={`flex items-center justify-center py-2 rounded-lg transition-colors ${
                        !inStore ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-200"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/dashboard/business"
                      title="Mi tienda"
                      className={`flex items-center justify-center py-2 rounded-lg transition-colors ${
                        inStore ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-200"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <AccountModeSwitcher />
                )
              ) : role === "admin" ? (
                <Link
                  href="/admin"
                  title="Mi panel"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all ${collapsed ? "justify-center" : ""}`}
                >
                  <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && "Mi panel"}
                </Link>
              ) : null}

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all ${collapsed ? "justify-center" : ""}`}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && "Cerrar sesión"}
              </button>
            </>
          ) : (
            /* No logueado */
            <>
              <Link
                href="/login"
                title="Iniciar sesión"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all ${collapsed ? "justify-center" : ""}`}
              >
                <LogIn className="w-5 h-5 flex-shrink-0" />
                {!collapsed && "Iniciar sesión"}
              </Link>

              <Link
                href="/register"
                title="Registrarse"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-colors ${collapsed ? "justify-center" : ""}`}
              >
                <UserPlus className="w-5 h-5 flex-shrink-0" />
                {!collapsed && "Registrarse"}
              </Link>
            </>
          )
        )}

        <div className={`flex items-center pt-2 ${collapsed ? "justify-center" : "px-3"}`}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
