"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { BarChart2, TrendingUp, Users, ShoppingBag, Star, ArrowUp, ArrowDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";
import { loadOwnedBusinesses } from "@/lib/current-business";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Bucket {
  label: string;
  revenue: number;
  orders: number;
  customers: number;
}

const MONTHLY_DEMO: Bucket[] = [
  { label: "Ene", revenue: 8200, orders: 18, customers: 14 },
  { label: "Feb", revenue: 9400, orders: 21, customers: 17 },
  { label: "Mar", revenue: 11200, orders: 26, customers: 22 },
  { label: "Abr", revenue: 10500, orders: 23, customers: 19 },
  { label: "May", revenue: 13800, orders: 31, customers: 28 },
  { label: "Jun", revenue: 15640, orders: 34, customers: 31 },
];

const WEEKLY_DEMO: Bucket[] = [
  { label: "Lun", revenue: 1200, orders: 3, customers: 2 },
  { label: "Mar", revenue: 890, orders: 2, customers: 2 },
  { label: "Mié", revenue: 2100, orders: 5, customers: 4 },
  { label: "Jue", revenue: 1750, orders: 4, customers: 3 },
  { label: "Vie", revenue: 2340, orders: 6, customers: 5 },
  { label: "Sáb", revenue: 1980, orders: 5, customers: 4 },
  { label: "Dom", revenue: 650, orders: 1, customers: 1 },
];

const TOP_PRODUCTS_DEMO = [
  { name: "Taladro Percutor 750W", sold: 18, revenue: 16002 },
  { name: "Pintura Vinílica 4L", sold: 12, revenue: 3840 },
  { name: "Kit Fumigador Pro", sold: 9, revenue: 2520 },
  { name: "Cortadora de Césped", sold: 6, revenue: 8700 },
  { name: "Nivel Láser Digital", sold: 5, revenue: 2900 },
];

const DEMO_KPIS = {
  revenue: 15640, revenueGrowthPct: 23,
  orders: 34, ordersDelta: 8,
  customers: 31, customersDelta: 3,
  rating: 4.7, reviews: 89,
};

type Period = "semanal" | "mensual";
type Metric = "revenue" | "orders" | "customers";

const METRIC_CONFIG = {
  revenue: { label: "Ingresos", color: "bg-brand-500 dark:bg-brand-400", fmt: (v: number) => formatPrice(v) },
  orders: { label: "Pedidos", color: "bg-blue-500 dark:bg-blue-400", fmt: (v: number) => String(v) },
  customers: { label: "Clientes", color: "bg-green-500 dark:bg-green-400", fmt: (v: number) => String(v) },
};

function monthRange(d: Date): readonly [number, number] {
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return [start, end];
}

function dayRange(d: Date): readonly [number, number] {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return [start, start + 24 * 60 * 60 * 1000];
}

// Construye `count` cubetas terminando "hoy" (offset 0 = la más reciente).
// Regresa de la más vieja a la más nueva.
function buildBuckets(
  orders: Order[],
  firstOrderByUser: Map<string, number>,
  count: number,
  rangeFor: (offsetFromNow: number) => readonly [number, number],
  labelFor: (offsetFromNow: number) => string
): Bucket[] {
  const buckets: Bucket[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const [start, end] = rangeFor(offset);
    const inRange = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= start && t < end;
    });
    const newCustomers = new Set(
      [...firstOrderByUser.entries()].filter(([, t]) => t >= start && t < end).map(([uid]) => uid)
    ).size;
    buckets.push({
      label: labelFor(offset),
      revenue: inRange.reduce((s, o) => s + o.total, 0),
      orders: inRange.length,
      customers: newCustomers,
    });
  }
  return buckets;
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const [period, setPeriod] = useState<Period>("mensual");
  const [metric, setMetric] = useState<Metric>("revenue");
  const [loading, setLoading] = useState(!IS_DEMO);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const supabase = createClient();

  useEffect(() => {
    if (IS_DEMO) return; // loading ya arrancó en false
    if (!isLoaded || !user) return;

    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) { setLoading(false); return; }
      setRating({ avg: biz.rating_avg ?? 0, count: biz.rating_count ?? 0 });

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: true });

      // Los pedidos cancelados no cuentan como ventas reales.
      setOrders(((data ?? []) as Order[]).filter((o) => o.status !== "cancelado"));
      setLoading(false);
    };
    load();
  }, [isLoaded, user?.id]);

  const real = useMemo(() => {
    const firstOrderByUser = new Map<string, number>();
    for (const o of orders) {
      const t = new Date(o.created_at).getTime();
      const prev = firstOrderByUser.get(o.user_id);
      if (prev === undefined || t < prev) firstOrderByUser.set(o.user_id, t);
    }

    const now = new Date();

    const monthlyAll = buildBuckets(
      orders, firstOrderByUser, 12,
      (offset) => monthRange(new Date(now.getFullYear(), now.getMonth() - offset, 1)),
      (offset) => MONTH_LABELS[new Date(now.getFullYear(), now.getMonth() - offset, 1).getMonth()]
    );
    const dailyAll = buildBuckets(
      orders, firstOrderByUser, 14,
      (offset) => dayRange(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)),
      (offset) => DAY_LABELS[new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset).getDay()]
    );

    const currentMonth = monthlyAll[11];
    const previousMonth = monthlyAll[10];
    const pctDelta = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100));

    const productMap = new Map<string, { sold: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.order_items ?? []) {
        const entry = productMap.get(item.name) ?? { sold: 0, revenue: 0 };
        entry.sold += item.quantity;
        entry.revenue += item.price * item.quantity;
        productMap.set(item.name, entry);
      }
    }
    const topProducts = [...productMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return {
      monthly: monthlyAll.slice(6),
      weekly: dailyAll.slice(7),
      prevMonthlyTotal: { revenue: monthlyAll.slice(0, 6).reduce((s, b) => s + b.revenue, 0), orders: monthlyAll.slice(0, 6).reduce((s, b) => s + b.orders, 0), customers: monthlyAll.slice(0, 6).reduce((s, b) => s + b.customers, 0) },
      prevWeeklyTotal: { revenue: dailyAll.slice(0, 7).reduce((s, b) => s + b.revenue, 0), orders: dailyAll.slice(0, 7).reduce((s, b) => s + b.orders, 0), customers: dailyAll.slice(0, 7).reduce((s, b) => s + b.customers, 0) },
      kpis: {
        revenue: currentMonth.revenue,
        revenueGrowthPct: pctDelta(currentMonth.revenue, previousMonth.revenue),
        orders: currentMonth.orders,
        ordersDelta: currentMonth.orders - previousMonth.orders,
        customers: currentMonth.customers,
        customersDelta: currentMonth.customers - previousMonth.customers,
      },
      topProducts,
      hasAnyOrder: orders.length > 0,
    };
  }, [orders]);

  const data = IS_DEMO ? (period === "semanal" ? WEEKLY_DEMO : MONTHLY_DEMO) : (period === "semanal" ? real.weekly : real.monthly);
  const prevTotal = IS_DEMO
    ? (metric === "revenue" ? 11200 : metric === "orders" ? 26 : 22)
    : (period === "semanal" ? real.prevWeeklyTotal[metric] : real.prevMonthlyTotal[metric]);
  const values = data.map((d) => d[metric]);
  const maxVal = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0);
  const growth = prevTotal === 0 ? (total > 0 ? 100 : 0) : Math.round(((total - prevTotal) / prevTotal) * 100);
  const cfg = METRIC_CONFIG[metric];

  const kpiSource = IS_DEMO ? DEMO_KPIS : { ...real.kpis, rating: rating.avg, reviews: rating.count };
  const kpis = [
    { label: "Ingresos totales", value: formatPrice(kpiSource.revenue), sub: `${kpiSource.revenueGrowthPct >= 0 ? "+" : ""}${kpiSource.revenueGrowthPct}% vs mes anterior`, icon: TrendingUp, up: kpiSource.revenueGrowthPct >= 0, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-500/10" },
    { label: "Total pedidos", value: String(kpiSource.orders), sub: `${kpiSource.ordersDelta >= 0 ? "+" : ""}${kpiSource.ordersDelta} vs mes anterior`, icon: ShoppingBag, up: kpiSource.ordersDelta >= 0, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Clientes nuevos", value: String(kpiSource.customers), sub: `${kpiSource.customersDelta >= 0 ? "+" : ""}${kpiSource.customersDelta} vs mes anterior`, icon: Users, up: kpiSource.customersDelta >= 0, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Calificación", value: `${(IS_DEMO ? DEMO_KPIS.rating : rating.avg).toFixed(1)} ★`, sub: `${IS_DEMO ? DEMO_KPIS.reviews : rating.count} reseñas totales`, icon: Star, up: null, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-500/10" },
  ];

  const topProducts = IS_DEMO ? TOP_PRODUCTS_DEMO : real.topProducts;
  const topMaxSold = Math.max(...topProducts.map((p) => p.sold), 1);

  if (!IS_DEMO && loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-100 dark:bg-white/5 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-100 dark:bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-brand-500" /> Estadísticas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Rendimiento de tu negocio</p>
      </div>

      {!IS_DEMO && !real.hasAnyOrder ? (
        <div className="card p-10 text-center">
          <BarChart2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no tienes pedidos. Las estadísticas aparecerán en cuanto empieces a vender.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, value, sub, icon: Icon, up, color, bg }) => (
              <div key={label} className="card p-5">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 text-xs leading-tight">{label}</p>
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                  up === true ? "text-green-600 dark:text-green-400" :
                  up === false ? "text-red-500 dark:text-red-400" :
                  "text-slate-400"
                }`}>
                  {up === true && <ArrowUp className="w-3 h-3" />}
                  {up === false && <ArrowDown className="w-3 h-3" />}
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card p-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {cfg.label} — {period}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {/* Metric selector */}
                <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
                  {(Object.keys(METRIC_CONFIG) as Metric[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetric(m)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        metric === m ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {METRIC_CONFIG[m].label}
                    </button>
                  ))}
                </div>
                {/* Period selector */}
                <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
                  {(["semanal", "mensual"] as Period[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                        period === p ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="flex items-end gap-2 h-40">
              {data.map((d, i) => {
                const val = d[metric];
                const heightPct = maxVal > 0 ? Math.max(4, (val / maxVal) * 100) : 4;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">
                      {cfg.fmt(val)}
                    </span>
                    <div
                      className={`w-full ${cfg.color} rounded-t-lg transition-all duration-300 hover:opacity-80`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{d.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Total {period}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">{cfg.fmt(total)}</span>
                <span className={`text-xs flex items-center gap-0.5 font-medium ${growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {growth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(growth)}% vs anterior
                </span>
              </div>
            </div>
          </div>

          {/* Top products */}
          {topProducts.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Productos más vendidos</h2>
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">{p.sold} uds.</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPrice(p.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 dark:bg-brand-400 rounded-full"
                        style={{ width: `${(p.sold / topMaxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
