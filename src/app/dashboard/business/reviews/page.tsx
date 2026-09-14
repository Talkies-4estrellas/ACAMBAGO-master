"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, MessageSquare, User, Search } from "lucide-react";
import { DEMO_ALL_REVIEWS } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import { Review } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { loadOwnedBusinesses } from "@/lib/current-business";

const STAR_FILTERS = [0, 5, 4, 3, 2, 1] as const;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

function StarBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ReviewsPage() {
  const { user, isLoaded } = useUser();
  const [starFilter, setStarFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!IS_DEMO);
  const [realReviews, setRealReviews] = useState<Review[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (IS_DEMO) return;
    if (!isLoaded || !user) return;

    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) { setLoading(false); return; }

      const { data } = await supabase
        .from("reviews")
        .select("*, profiles(name)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false });

      setRealReviews((data ?? []) as unknown as Review[]);
      setLoading(false);
    };
    load();
  }, [isLoaded, user?.id]);

  const allReviews = IS_DEMO ? DEMO_ALL_REVIEWS.slice(0, 40) : realReviews;

  const avgRating = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 0;

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: allReviews.filter((r) => r.rating === s).length,
  }));

  const filtered = allReviews.filter((r) => {
    const matchStar = starFilter === 0 || r.rating === starFilter;
    const matchSearch = !search || (r.comment ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStar && matchSearch;
  });

  if (!IS_DEMO && loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-slate-100 dark:bg-white/5 rounded-lg" />
        <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Reseñas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Lo que dicen tus clientes</p>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Big number */}
          <div className="text-center sm:border-r sm:border-slate-100 dark:sm:border-white/10 sm:pr-6">
            <p className="text-6xl font-bold text-slate-900 dark:text-white">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center gap-0.5 mt-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-600 fill-slate-200 dark:fill-slate-600"}`} />
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{allReviews.length} reseñas</p>
          </div>

          {/* Bars */}
          <div className="flex-1 space-y-2 w-full">
            {starCounts.map(({ star, count }) => (
              <button
                key={star}
                onClick={() => setStarFilter(starFilter === star ? 0 : star)}
                className={`flex items-center gap-2 w-full group rounded-lg p-1 -ml-1 transition-colors ${starFilter === star ? "bg-yellow-50 dark:bg-yellow-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
              >
                <span className="text-sm text-slate-500 dark:text-slate-400 w-3 flex-shrink-0">{star}</span>
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <StarBar count={count} total={allReviews.length} />
                <span className="text-xs text-slate-400 dark:text-slate-500 w-5 text-right flex-shrink-0">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en comentarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <div className="flex gap-1.5">
          {STAR_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                starFilter === s
                  ? "bg-yellow-400 text-white"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {s === 0 ? "Todas" : <><Star className="w-3 h-3 fill-current" /> {s}</>}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} reseñas</p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No se encontraron reseñas</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                      {r.profiles?.name ?? "Cliente"}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-600 fill-slate-200 dark:fill-slate-600"}`} />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">{r.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
