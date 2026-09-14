"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Business } from "@/types";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { Search, Store, Star, MapPin, Ticket } from "lucide-react";
import AdminBusinessActions from "./AdminBusinessActions";
import AssignCouponsButton from "./AssignCouponsButton";

interface Props {
  businesses: Business[];
  isDemo: boolean;
}

export default function ApprovedBusinessesList({ businesses, isDemo }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q)
    );
  }, [businesses, query]);

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, categoría o dirección..."
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            {businesses.length === 0 ? "No hay negocios aprobados todavía." : "Ningún negocio coincide con tu búsqueda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <div key={b.id} className={`card p-4 flex items-start gap-3 ${!b.is_active ? "opacity-60" : ""}`}>
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <CategoryIcon category={b.category} className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <Link href={`/business/${b.id}`} target="_blank" className="font-semibold text-slate-900 dark:text-white text-sm truncate hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
                      {b.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{b.category}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {Number(b.rating_avg).toFixed(1)} ({b.rating_count})
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        b.is_active
                          ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
                      }`}>
                        {b.is_active ? "Activo" : "Suspendido"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> Cupones disponibles: {b.coupon_credits ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{b.address}</span>
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {!isDemo ? (
                    <>
                      <AdminBusinessActions businessId={b.id} businessName={b.name} isApproved={true} isActive={b.is_active} />
                      <AssignCouponsButton businessId={b.id} businessName={b.name} />
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Demo — sin acción</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
