"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Heart, MapPin, Settings, MessageSquare, MessageCircle, Bell, Ticket } from "lucide-react";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import AccountModeSwitcher from "@/components/ui/AccountModeSwitcher";
import NotificationBellDropdown from "@/components/ui/NotificationBellDropdown";

const navItems = [
  { href: "/perfil",               label: "Mi perfil",      icon: LayoutDashboard, exact: true },
  { href: "/perfil/pedidos",       label: "Mis compras",    icon: Package,         exact: false },
  { href: "/perfil/favoritos",     label: "Favoritos",      icon: Heart,           exact: false },
  { href: "/perfil/mensajes",      label: "Mis mensajes",   icon: MessageCircle,   exact: false },
  { href: "/perfil/preguntas",     label: "Mis preguntas",  icon: MessageSquare,   exact: false },
  { href: "/perfil/notificaciones", label: "Notificaciones", icon: Bell,           exact: false },
  { href: "/perfil/cupones",       label: "Cupones",        icon: Ticket,          exact: false },
  { href: "/perfil/direcciones",   label: "Direcciones",    icon: MapPin,          exact: false },
  { href: "/perfil/configuracion", label: "Configuración",  icon: Settings,        exact: false },
];

export default function PerfilShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userId, role, hasBusiness } = useAuthUser();

  // "Crear tienda"/"Crear sucursal" son flujos aparte (no un tab de esta
  // seccion): se dejan sin el sidebar de cuenta para no confundirlos con una
  // pestana mas.
  if (pathname.startsWith("/perfil/crear-tienda") || pathname.startsWith("/perfil/crear-sucursal")) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {userId && (
        <div className="hidden lg:flex justify-end mb-3">
          <NotificationBellDropdown userId={userId} viewAllHref="/perfil/notificaciones" />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-3">
          {/* hasBusiness cubre tiendas pendientes de aprobación (rol
              todavía "client"), no solo las ya aprobadas ("business"). */}
          {(role === "business" || hasBusiness) && <AccountModeSwitcher />}

          <nav className="card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
