"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Package, Clock, Heart, Ticket, LayoutGrid,
  TrendingUp, Coins, MapPin, Store, Settings, LogOut, User,
  MessageSquare, Bell,
} from "lucide-react";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import { getDemoMode, stopDemoMode } from "@/lib/demo-mode";
import { useClerk } from "@clerk/nextjs";

interface Row {
  icon: typeof Package;
  label: string;
  href: string;
  badge?: string;
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="mb-2 lg:mb-0">
      <p className="px-4 lg:px-0 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">{title}</p>
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl mx-4 lg:mx-0 border border-slate-100 dark:border-white/10 overflow-hidden">
        {rows.map((row, i) => (
          <Link
            key={row.label}
            href={row.href}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
              i > 0 ? "border-t border-slate-100 dark:border-white/10" : ""
            }`}
          >
            <row.icon className="w-5 h-5 text-slate-500 dark:text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-slate-800 dark:text-gray-200">{row.label}</span>
            {row.badge && (
              <span className="text-[10px] font-bold uppercase bg-brand-500 text-white px-2 py-0.5 rounded-full">{row.badge}</span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function MasPage() {
  const router = useRouter();
  const { userId, name, role, hasBusiness, loading } = useAuthUser();
  // hasBusiness cubre tiendas pendientes de aprobación (rol todavía
  // "client"), no solo las ya aprobadas ("business"). Se excluye admin.
  const actingAsSeller = role !== "admin" && (role === "business" || hasBusiness);
  const { signOut } = useClerk();

  useEffect(() => {
    if (!loading && !userId) router.push("/login");
  }, [loading, userId, router]);

  const handleLogout = async () => {
    if (getDemoMode()) { stopDemoMode(); return; }
    await signOut();
    router.push("/");
  };

  return (
    <div className="max-w-lg lg:max-w-5xl mx-auto pb-10">
      {/* Header estilo Mercado Libre, con los colores de AcambaGo */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white px-5 pt-8 pb-6 lg:rounded-2xl lg:mt-4">
        <Link href="/perfil" className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/15 border border-white/30 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold">{name ?? "Mi cuenta"}</p>
            <span className="text-sm text-brand-100 flex items-center gap-1">
              Ver mi perfil <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-6 lg:px-4">
        <Section
          title="Mi actividad"
          rows={[
            { icon: Package, label: "Mis pedidos", href: "/perfil/pedidos" },
            { icon: MapPin, label: "Mis direcciones", href: "/perfil/direcciones" },
            { icon: Clock, label: "Vistos recientemente", href: "/vistos-recientemente" },
            { icon: Heart, label: "Favoritos", href: "/perfil/favoritos" },
            { icon: MessageSquare, label: "Mis preguntas", href: "/perfil/preguntas" },
            { icon: Bell, label: "Notificaciones", href: "/perfil/notificaciones" },
            { icon: Ticket, label: "Cupones canjeados", href: "/perfil" },
          ]}
        />

        <Section
          title="Descubre"
          rows={[
            { icon: LayoutGrid, label: "Categorías", href: "/#categorias" },
            { icon: TrendingUp, label: "Más vendidos", href: "/productos?sort=vendidos" },
            { icon: Coins, label: "Menos de $500", href: "/productos?sort=precio_asc" },
            { icon: MapPin, label: "Mapa de negocios", href: "/map" },
            { icon: Ticket, label: "Cupones disponibles", href: "/coupons" },
          ]}
        />

        <Section
          title="Vender"
          rows={
            actingAsSeller
              ? [{ icon: Store, label: "Ir a mi tienda", href: "/dashboard/business" }]
              : [{ icon: Store, label: "Publica tu tienda gratis", href: "/perfil/crear-tienda", badge: "Nuevo" }]
          }
        />

        <div className="mb-2 lg:mb-0">
          <p className="px-4 lg:px-0 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">Cuenta</p>
          <div className="bg-white dark:bg-[#0a1628] rounded-2xl mx-4 lg:mx-0 border border-slate-100 dark:border-white/10 overflow-hidden">
            <Link href="/perfil/configuracion" className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Settings className="w-5 h-5 text-slate-500 dark:text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-slate-800 dark:text-gray-200">Configuración de mi perfil</span>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-white/10"
            >
              <LogOut className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400 text-left">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
