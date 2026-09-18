"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Ticket, Settings, ScanLine, Star, ShoppingBag, BarChart2, MessageSquare, MessageCircle, Bell } from "lucide-react";

const navItems = [
  { href: "/dashboard/business",                label: "Resumen",         icon: LayoutDashboard },
  { href: "/dashboard/business/products",       label: "Productos",       icon: Package },
  { href: "/dashboard/business/orders",         label: "Pedidos",         icon: ShoppingBag },
  { href: "/dashboard/business/coupons",        label: "Cupones",         icon: Ticket },
  { href: "/dashboard/business/coupons/scan",   label: "Escáner QR",      icon: ScanLine },
  { href: "/dashboard/business/mensajes",       label: "Mensajes",        icon: MessageCircle },
  { href: "/dashboard/business/preguntas",      label: "Preguntas",       icon: MessageSquare },
  { href: "/dashboard/business/notificaciones", label: "Notificaciones",  icon: Bell },
  { href: "/dashboard/business/reviews",        label: "Reseñas",         icon: Star },
  { href: "/dashboard/business/analytics",      label: "Estadísticas",    icon: BarChart2 },
  { href: "/dashboard/business/settings",       label: "Configuración",   icon: Settings },
];

// Mientras la tienda está pendiente de aprobación, PendingApprovalGate ya
// bloquea el contenido de todo lo que no sea /settings — el menú de escritorio
// tampoco debe listar el resto (Productos, Pedidos, Reseñas, Estadísticas...),
// para no revelar la estructura completa del panel a alguien que ni siquiera
// ha sido aprobado todavía. Solo Configuración, nada más (a diferencia de la
// barra móvil de abajo, que sí agrega Inicio/Buscar — decisión explícita del
// usuario de mantener el escritorio más restringido).
const pendingItems = [
  { href: "/dashboard/business/settings", label: "Configuración", icon: Settings },
];

export default function DashboardNav({ pendingApproval = false }: { pendingApproval?: boolean }) {
  const pathname = usePathname();
  const items = pendingApproval ? pendingItems : navItems;

  return (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard/business" || href === "/"
            ? pathname === href
            : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
            }`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
