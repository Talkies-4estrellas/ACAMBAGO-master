"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Store } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getDemoMode, DEMO_BUYER_COUPONS } from "@/lib/demo-mode";

interface Redemption {
  id: string;
  redeemed_at: string;
  coupons: { title: string; value: number; discount_type: string; businesses: { name: string } };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function MisCuponesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (getDemoMode() || IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    supabase
      .from("coupon_redemptions")
      .select("id, redeemed_at, coupons(title, value, discount_type, businesses(name))")
      .eq("user_id", user.id)
      .order("redeemed_at", { ascending: false })
      .then(({ data }) => {
        setRedemptions((data ?? []) as unknown as Redemption[]);
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-500" /> Mis cupones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cupones que has canjeado en tiendas de Acámbaro</p>
        </div>
        <Link href="/coupons" className="btn-primary inline-flex items-center gap-2 text-sm flex-shrink-0">
          <Ticket className="w-4 h-4" /> Explorar cupones
        </Link>
      </div>

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
