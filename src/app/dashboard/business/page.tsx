"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { DEMO_BUSINESS, DEMO_STATS } from "@/lib/demo-data";
import {
  Package, Ticket, Star, ScanLine, Plus, ArrowRight,
  TrendingUp, TrendingDown, ShoppingBag, Users,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { Order } from "@/types";
import { loadOwnedBusinesses } from "@/lib/current-business";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

const DEMO_CHART_DATA = [
  { label: "Lun", value: 1200 },
  { label: "Mar", value: 890 },
  { label: "Mié", value: 2100 },
  { label: "Jue", value: 1750 },
  { label: "Vie", value: 2340 },
  { label: "Sáb", value: 1980 },
  { label: "Dom", value: 650 },
];

const DEMO_RECENT_ORDERS = [
  { id: "ORD-001", customer: "María García", product: "Taladro 750W", total: 889, status: "pendiente" as const, date: "Hoy 10:32" },
  { id: "ORD-002", customer: "Carlos Ramírez", product: "Playera Casual", total: 189, status: "en_camino" as const, date: "Ayer 17:15" },
  { id: "ORD-003", customer: "Ana Martínez", product: "Kit Fumigador", total: 280, status: "entregado" as const, date: "Ayer 14:02" },
  { id: "ORD-004", customer: "Luisa Torres", product: "Taladro 750W x2", total: 1778, status: "pendiente" as const, date: "26 Jun" },
];

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return [start, start + 24 * 60 * 60 * 1000] as const;
}

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const [todayStart] = dayBounds(now);
  const [dayStart] = dayBounds(d);
  const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  if (dayStart === todayStart) return `Hoy ${time}`;
  if (todayStart - dayStart === 24 * 60 * 60 * 1000) return `Ayer ${time}`;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function orderProductSummary(o: Order) {
  const items = o.order_items ?? [];
  if (items.length === 0) return "Pedido";
  if (items.length === 1) return `${items[0].name}${items[0].quantity > 1 ? ` x${items[0].quantity}` : ""}`;
  return `${items[0].name} y ${items.length - 1} más`;
}

interface Stats {
  products: number;
  coupons: number;
  reviews: number;
  redemptions: number;
  rating_avg: number;
  rating_count: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [business, setBusiness] = useState<any>(IS_DEMO ? DEMO_BUSINESS : null);
  const [stats, setStats] = useState<Stats>(DEMO_STATS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(IS_DEMO);
  const [noBusiness, setNoBusiness] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (IS_DEMO) return;
    if (!isLoaded || !user) return;
    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);

      if (!biz) { setNoBusiness(true); setLoaded(true); return; }
      setBusiness(biz);

      const [
        { count: products },
        { count: coupons },
        { count: reviews },
        { count: redemptions },
        { data: bizOrders },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("business_id", biz.id),
        supabase.from("coupons").select("*", { count: "exact", head: true }).eq("business_id", biz.id).eq("is_active", true),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("business_id", biz.id),
        supabase.from("coupon_redemptions").select("*", { count: "exact", head: true }).eq("business_id", biz.id),
        supabase.from("orders").select("*, order_items(*)").eq("business_id", biz.id).order("created_at", { ascending: false }),
      ]);

      setOrders(((bizOrders ?? []) as Order[]).filter((o) => o.status !== "cancelado"));

      setStats({
        products: products ?? 0, coupons: coupons ?? 0,
        reviews: reviews ?? 0, redemptions: redemptions ?? 0,
        rating_avg: Number(biz.rating_avg) ?? 0, rating_count: biz.rating_count ?? 0,
      });
      setLoaded(true);
    };
    load();
  }, [isLoaded, user?.id]);

  if (!loaded) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-slate-100 dark:bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-52 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (noBusiness) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registra tu negocio</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          Aun no tienes un perfil de negocio. Completa tus datos para aparecer en el directorio y gestionar productos y cupones.
        </p>
        <button
          onClick={() => router.push("/perfil/crear-tienda")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear perfil de negocio
        </button>
      </div>
    );
  }

  const now = new Date();
  const [todayStart] = dayBounds(now);
  const todayRevenue = IS_DEMO ? 2340 : orders.filter((o) => new Date(o.created_at).getTime() >= todayStart).reduce((s, o) => s + o.total, 0);
  const pendingCount = IS_DEMO ? 3 : orders.filter((o) => o.status === "pendiente").length;

  const weekChart = IS_DEMO ? DEMO_CHART_DATA : Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const [start, end] = dayBounds(d);
    const value = orders
      .filter((o) => { const t = new Date(o.created_at).getTime(); return t >= start && t < end; })
      .reduce((s, o) => s + o.total, 0);
    return { label: DAY_LABELS[d.getDay()], value };
  });
  const weekMax = Math.max(...weekChart.map((d) => d.value), 1);

  const recentOrders = IS_DEMO ? DEMO_RECENT_ORDERS : orders.slice(0, 4).map((o) => ({
    id: o.id, customer: o.customer_name, product: orderProductSummary(o),
    total: o.total, status: o.status, date: formatOrderDate(o.created_at),
  }));

  const kpis = [
    {
      label: "Ingresos hoy",
      value: formatPrice(todayRevenue),
      trend: IS_DEMO ? "+12%" : null,
      up: IS_DEMO ? true : null,
      icon: TrendingUp,
      bg: "bg-green-50 dark:bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-100 dark:border-green-500/20",
    },
    {
      label: "Pedidos pendientes",
      value: String(pendingCount),
      trend: IS_DEMO ? "+2" : null,
      up: IS_DEMO ? true : null,
      icon: ShoppingBag,
      bg: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-500/20",
      href: "/dashboard/business/orders",
    },
    {
      label: "Productos",
      value: String(stats.products),
      trend: null,
      icon: Package,
      bg: "bg-brand-50 dark:bg-brand-500/10",
      text: "text-brand-600 dark:text-brand-400",
      border: "border-brand-100 dark:border-brand-500/20",
      href: "/dashboard/business/products",
    },
    {
      label: "Calificación",
      value: `${Number(stats.rating_avg).toFixed(1)} ★`,
      trend: `${stats.rating_count} reseñas`,
      icon: Star,
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-100 dark:border-yellow-500/20",
      href: "/dashboard/business/reviews",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{business?.name ?? "Mi Negocio"}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">{business?.category} · {business?.address}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 px-3 py-1.5 rounded-full">
            ✓ Negocio aprobado
          </span>
          <Link href={`/business/${business?.id ?? "demo"}`} className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Ver perfil público →
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, trend, up, icon: Icon, bg, text, border, href }) => {
          const card = (
            <div className={`card p-5 hover:shadow-md transition-all ${href ? "cursor-pointer" : ""}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                {trend && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    up === true ? "text-green-600 dark:text-green-400" :
                    up === false ? "text-red-500 dark:text-red-400" :
                    "text-slate-400"
                  }`}>
                    {up === true && <TrendingUp className="w-3 h-3" />}
                    {up === false && <TrendingDown className="w-3 h-3" />}
                    {trend}
                  </span>
                )}
              </div>
            </div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      {/* Revenue chart + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              Ingresos — últimos 7 días
            </h2>
            <Link href="/dashboard/business/analytics" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
              Ver más →
            </Link>
          </div>
          {/* CSS bar chart */}
          <div className="flex items-end gap-2 h-36">
            {weekChart.map(({ label, value }, i) => (
              <div key={`${label}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {formatPrice(value).replace("MXN", "").trim().replace("$", "$")}
                </span>
                <div
                  className="w-full bg-brand-500 dark:bg-brand-400 rounded-t-lg transition-all hover:bg-brand-600 dark:hover:bg-brand-300"
                  style={{ height: `${Math.max(8, (value / weekMax) * 100)}%` }}
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Total semana</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatPrice(weekChart.reduce((s, d) => s + d.value, 0))}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Acciones rápidas</h2>
          {[
            { href: "/dashboard/business/products",     icon: Plus,     label: "Nuevo producto",   sub: "Agregar al catálogo",     color: "text-brand-600 dark:text-brand-400",  bg: "bg-brand-50 dark:bg-brand-500/10",   border: "border-brand-100 dark:border-brand-500/20" },
            { href: "/dashboard/business/coupons/new",  icon: Ticket,   label: "Crear cupón",       sub: "Con código QR",           color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-100 dark:border-orange-500/20" },
            { href: "/dashboard/business/coupons/scan", icon: ScanLine, label: "Escanear cupón",    sub: "Validar en tiempo real",  color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-500/10",   border: "border-green-100 dark:border-green-500/20" },
            { href: "/dashboard/business/orders",       icon: ShoppingBag, label: "Ver pedidos",    sub: `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`, color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-100 dark:border-blue-500/20" },
          ].map(({ href, icon: Icon, label, sub, color, bg, border }) => (
            <Link key={href} href={href} className="card p-4 hover:shadow-md transition-all flex items-center gap-3 group hover:border-brand-200 dark:hover:border-brand-500/30">
              <div className={`w-9 h-9 ${bg} border ${border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-500" />
            Pedidos recientes
          </h2>
          <Link href="/dashboard/business/orders" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {recentOrders.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Todavía no tienes pedidos.</p>
          )}
          {recentOrders.map((o) => (
              <div key={o.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{o.customer}</p>
                    <span className="text-[10px] text-slate-400">#{o.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{o.product}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatPrice(o.total)}</span>
                  <span className="text-xs text-slate-400 hidden sm:block">{o.date}</span>
                </div>
              </div>
          ))}
        </div>
      </div>

      {/* Cupones + rating row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-orange-500" /> Cupones activos
          </h2>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">{stats.coupons}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stats.redemptions} canjeados en total</p>
          <Link href="/dashboard/business/coupons" className="mt-3 text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
            Gestionar cupones <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> Satisfaccion
          </h2>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">
              {Number(stats.rating_avg).toFixed(1)}
            </span>
            <div className="mb-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(stats.rating_avg) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-600 fill-slate-200 dark:fill-slate-600"}`} />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stats.rating_count} reseñas</p>
            </div>
          </div>
          <Link href="/dashboard/business/reviews" className="mt-3 text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
            Ver reseñas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
