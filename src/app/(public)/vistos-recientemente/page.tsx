"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import ProductsReel from "@/components/ui/ProductsReel";
import { getRecentlyViewed, RecentlyViewedItem } from "@/lib/recently-viewed";

export default function RecentlyViewedPage() {
  const [items, setItems] = useState<RecentlyViewedItem[] | null>(null);

  useEffect(() => {
    // Se difiere con un microtask para no llamar setState de forma
    // sincrona dentro del efecto (evita renders en cascada).
    queueMicrotask(() => setItems(getRecentlyViewed()));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vistos recientemente</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Productos que has visto en este navegador</p>
        </div>
      </div>

      {items === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-64 animate-pulse bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-14 text-center">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">Todavía no has visto ningún producto</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">Los productos que veas aparecerán aquí</p>
          <Link href="/productos" className="btn-primary text-sm mx-auto flex items-center gap-2 w-fit">
            Ver productos
          </Link>
        </div>
      ) : (
        <ProductsReel grid items={items} />
      )}
    </div>
  );
}
