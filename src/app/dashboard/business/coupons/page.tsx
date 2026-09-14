"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Coupon } from "@/types";
import CouponCard from "@/components/coupons/CouponCard";
import { Plus, Ticket, Pencil, CheckCircle2, Clock, PauseCircle, Banknote } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { loadOwnedBusinesses } from "@/lib/current-business";
import { formatPrice } from "@/lib/utils";
import { DEMO_COUPONS } from "@/lib/demo-data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface RedemptionRow {
  redeemed_at: string;
  discount_amount: number | null;
}

export default function CouponsPage() {
  const { user, isLoaded } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCredits, setCouponCredits] = useState(0);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (IS_DEMO) {
      setCoupons(DEMO_COUPONS);
      setCouponCredits(5);
      setRedemptions([]);
      setLoading(false);
      return;
    }
    if (!isLoaded || !user) return;
    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) {
        window.location.href = "/perfil/crear-tienda";
        return;
      }
      setCouponCredits(biz.coupon_credits ?? 0);
      const [{ data: couponsData }, { data: redemptionsData }] = await Promise.all([
        supabase.from("coupons").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
        supabase.from("coupon_redemptions").select("redeemed_at, discount_amount").eq("business_id", biz.id),
      ]);
      setCoupons((couponsData ?? []) as Coupon[]);
      setRedemptions((redemptionsData ?? []) as RedemptionRow[]);
      setLoading(false);
    };
    load();
  }, [isLoaded, user?.id]);

  const totalDiscounted = useMemo(
    () => redemptions.reduce((sum, r) => sum + (r.discount_amount ?? 0), 0),
    [redemptions]
  );

  // Disponibles: activos, vigentes y con cupo. Pendientes: de esos, los que
  // nadie ha usado todavía. Utilizados: total de canjes de todos los tiempos
  // (independiente de si el cupón sigue activo o ya se agotó/desactivó).
  const stats = useMemo(() => {
    const now = new Date();
    let available = 0;
    let pending = 0;
    let used = 0;
    for (const c of coupons) {
      used += c.used_count;
      const notExpired = !c.expires_at || new Date(c.expires_at) >= now;
      const hasQuota = c.limit_count == null || c.used_count < c.limit_count;
      if (c.is_active && notExpired && hasQuota) {
        available++;
        if (c.used_count === 0) pending++;
      }
    }
    return { available, pending, used };
  }, [coupons]);

  // Canjes de los últimos 7 días, agrupados por día, para la mini gráfica.
  const weekChart = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = redemptions.filter((r) => {
        const t = new Date(r.redeemed_at).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      days.push({ label: DAY_LABELS[d.getDay()], value: count });
    }
    return days;
  }, [redemptions]);
  const weekMax = Math.max(1, ...weekChart.map((d) => d.value));

  const toggleActive = async (coupon: Coupon) => {
    if (IS_DEMO) { toast("Conecta Supabase para administrar cupones reales", { icon: "ℹ️" }); return; }
    const { error } = await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    if (!error) {
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(coupon.is_active ? "Cupón desactivado" : "Cupón activado");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (IS_DEMO) { toast("Conecta Supabase para administrar cupones reales", { icon: "ℹ️" }); return; }
    if (!confirm("¿Eliminar este cupón?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cupón eliminado");
  };

  const confirmRenew = async (coupon: Coupon) => {
    if (IS_DEMO) { toast("Conecta Supabase para administrar cupones reales", { icon: "ℹ️" }); return; }
    const { error } = await supabase
      .from("coupons")
      .update({ expires_at: renewDate || null, is_active: true })
      .eq("id", coupon.id);
    if (error) {
      toast.error("No se pudo renovar el cupón");
      return;
    }
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, expires_at: renewDate || undefined, is_active: true } : c))
    );
    setRenewingId(null);
    toast.success("Cupón renovado");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cupones</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{coupons.length} cupones creados</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 px-2 py-0.5 rounded-full">
              {couponCredits} disponibles para crear
            </span>
          </p>
        </div>
        <Link href="/dashboard/business/coupons/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Crear cupón
        </Link>
      </div>

      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:col-span-2">
            {[
              { label: "Disponibles", value: String(stats.available), icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
              { label: "Utilizados", value: String(stats.used), icon: Ticket, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-500/10" },
              { label: "Pendientes", value: String(stats.pending), icon: PauseCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: "Total descontado", value: formatPrice(totalDiscounted), icon: Banknote, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card p-4">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5" /> Canjes — últimos 7 días
            </p>
            <div className="flex items-end gap-1.5 h-16">
              {weekChart.map(({ label, value }, i) => (
                <div key={`${label}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-500 dark:bg-brand-400 rounded-t"
                    style={{ height: `${Math.max(4, (value / weekMax) * 100)}%` }}
                    title={`${value} canjes`}
                  />
                  <span className="text-[9px] text-gray-400 dark:text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="card p-12 text-center">
          <Ticket className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">Sin cupones todavía</p>
          <Link href="/dashboard/business/coupons/new" className="btn-primary mt-4 text-sm inline-block">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((c) => {
            const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
            const isRenewing = renewingId === c.id;
            return (
              <div key={c.id} className="space-y-2">
                <CouponCard coupon={c} showQR />
                <div className="flex gap-2 px-1 flex-wrap items-center">
                  {isExpired ? (
                    isRenewing ? (
                      <>
                        <input
                          type="date"
                          value={renewDate}
                          onChange={(e) => setRenewDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="input text-xs py-1.5 px-2 w-auto"
                        />
                        <button
                          onClick={() => confirmRenew(c)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setRenewingId(null)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setRenewingId(c.id); setRenewDate(""); }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        Renovar cupón
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => toggleActive(c)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        c.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {c.is_active ? "Desactivar" : "Activar"}
                    </button>
                  )}
                  <Link
                    href={`/dashboard/business/coupons/${c.id}/edit`}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </Link>
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
