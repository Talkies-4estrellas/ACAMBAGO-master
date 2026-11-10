"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Store, Bookmark, QrCode, ChevronUp, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { getDemoMode, DEMO_BUYER_COUPONS } from "@/lib/demo-mode";
import { getCouponUnavailableReason } from "@/lib/coupon-status";
import { parseDateOnly, personalizeCouponQr } from "@/lib/utils";

interface Redemption {
  id: string;
  coupon_id: string;
  redeemed_at: string;
  coupons: { title: string; value: number; discount_type: string; businesses: { name: string } };
}

interface SavedCoupon {
  id: string;
  origin: string;
  saved_at: string;
  coupons: {
    id: string;
    code: string;
    title: string;
    value: number;
    discount_type: string;
    qr_data: string;
    expires_at: string | null;
    is_active: boolean;
    limit_count: number | null;
    used_count: number;
    businesses: { name: string; is_approved: boolean; is_active: boolean } | null;
  } | null;
}

type SavedStatus = "vigente" | "vencido" | "usado" | "no_disponible";

const STATUS_STYLES: Record<SavedStatus, { label: string; cls: string }> = {
  vigente: { label: "Vigente", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" },
  vencido: { label: "Vencido", cls: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" },
  usado: { label: "Ya usado", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  no_disponible: { label: "No disponible", cls: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400" },
};

function savedStatus(s: SavedCoupon, redeemedIds: Set<string>): SavedStatus {
  const c = s.coupons;
  if (!c) return "no_disponible";
  if (redeemedIds.has(c.id)) return "usado";
  const reason = getCouponUnavailableReason(c, c.businesses);
  if (!reason) return "vigente";
  return reason === "expired" ? "vencido" : "no_disponible";
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function MisCuponesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [saved, setSaved] = useState<SavedCoupon[]>([]);
  const [openQr, setOpenQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (getDemoMode() || IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    Promise.all([
      supabase
        .from("coupon_redemptions")
        .select("id, coupon_id, redeemed_at, coupons(title, value, discount_type, businesses(name))")
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false }),
      supabase
        .from("saved_coupons")
        .select("id, origin, saved_at, coupons(id, code, title, value, discount_type, qr_data, expires_at, is_active, limit_count, used_count, businesses(name, is_approved, is_active))")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false }),
    ]).then(([redeemedRes, savedRes]) => {
      setRedemptions((redeemedRes.data ?? []) as unknown as Redemption[]);
      setSaved((savedRes.data ?? []) as unknown as SavedCoupon[]);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  if (loading || (!getDemoMode() && !IS_DEMO && !isLoaded)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const showDemoCoupons = getDemoMode() === "buyer" || IS_DEMO;
  const redeemedIds = new Set(redemptions.map((r) => r.coupon_id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-500" /> Mis cupones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cupones que guardaste o canjeaste en tiendas de Acámbaro</p>
        </div>
        <Link href="/coupons" className="btn-primary inline-flex items-center gap-2 text-sm flex-shrink-0">
          <Ticket className="w-4 h-4" /> Explorar cupones
        </Link>
      </div>

      {!showDemoCoupons && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-brand-500" /> Cupones guardados
            </h2>
          </div>

          {saved.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Todavía no has guardado cupones.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {saved.map((s) => {
                const c = s.coupons;
                const status = savedStatus(s, redeemedIds);
                const style = STATUS_STYLES[status];
                const qrOpen = openQr === s.id && status === "vigente" && !!c && !!user;
                return (
                  <div key={s.id} className="px-5 py-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c?.title ?? "Cupón"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                          <Store className="w-3 h-3" /> {c?.businesses?.name ?? "Negocio"}
                          {c?.expires_at && <span>· Vence {format(parseDateOnly(c.expires_at), "dd MMM yyyy", { locale: es })}</span>}
                          {s.origin === "revista" && (
                            <span className="inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-400">
                              · <BookOpen className="w-3 h-3" /> De la revista
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                          {c ? (c.discount_type === "percent" ? `${c.value}%` : `$${c.value}`) : ""}
                        </p>
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.cls}`}>{style.label}</span>
                      </div>
                    </div>

                    {status === "vigente" && c && user && (
                      <div>
                        <button
                          onClick={() => setOpenQr(qrOpen ? null : s.id)}
                          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                        >
                          {qrOpen ? <><ChevronUp className="w-3.5 h-3.5" /> Ocultar QR</> : <><QrCode className="w-3.5 h-3.5" /> Ver mi QR</>}
                        </button>
                        {qrOpen && (
                          <div className="mt-3 flex flex-col items-center gap-2">
                            <div className="bg-white p-3 rounded-2xl">
                              <QRCodeSVG value={personalizeCouponQr(c.qr_data, user.id)} size={180} bgColor="#ffffff" fgColor="#1f2937" level="M" />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Muéstralo en la tienda · <span className="font-mono">{c.code}</span></p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-4 h-4 text-orange-500" /> Cupones canjeados
          </h2>
        </div>

        {showDemoCoupons ? (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {DEMO_BUYER_COUPONS.map((c) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Store className="w-3 h-3" /> {c.businessName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {c.type === "percent" ? `${c.value}%` : `$${c.value}`}
                  </p>
                  <p className="text-xs text-slate-400">{c.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : redemptions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Todavía no has canjeado cupones.</p>
            <Link href="/coupons" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              Ver cupones disponibles
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {redemptions.map((r) => (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.coupons?.title ?? "Cupón"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Store className="w-3 h-3" /> {r.coupons?.businesses?.name ?? "Negocio"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {r.coupons?.discount_type === "percent" ? `${r.coupons.value}%` : `$${r.coupons?.value}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(r.redeemed_at), "dd MMM", { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
