"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DragScroll from "@/components/ui/DragScroll";
import {
  getRecentCategoriesSnapshot,
  subscribeToRecentCategories,
  trackCategoryView,
} from "@/lib/recently-viewed-categories";

const MAX_VISIBLE = 6;

interface Props {
  /** Categorías con al menos un producto disponible; sin ordenar. */
  categories: string[];
  activeCategory?: string;
  sort: string;
  q?: string;
}

function pillClass(active: boolean) {
  return `flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
    active
      ? "bg-brand-500 text-white border-brand-500"
      : "bg-white text-slate-600 border-slate-300 hover:border-brand-400 dark:bg-white/5 dark:text-gray-300 dark:border-white/20 dark:hover:border-brand-400"
  }`;
}

// La fila arranca en orden alfabético (mismo resultado en servidor y
// cliente, sin parpadeo en la primera visita); en cuanto el navegador ya
// tiene historial de categorías vistas, ese historial reemplaza el orden
// alfabético. Solo se muestran hasta MAX_VISIBLE — el resto sigue alcanzable
// desde /categorias, que ya lista todas con sus productos.
//
// El recorte por historial solo tiene sentido cuando de verdad hay más
// categorías que el tope: si el catálogo completo ya entra en MAX_VISIBLE,
// mostrarlas todas siempre, sin depender del historial. Si no, con un
// catálogo chico (como el de hoy, apenas 2 categorías) alguien que solo
// vio una categoría se quedaría viendo solo esa pastilla, ocultando la otra
// aunque sí tenga productos y sobre espacio de sobra para mostrarla.
export default function CategoryChips({ categories, activeCategory, sort, q }: Props) {
  const alphabetical = useMemo(() => [...categories].sort((a, b) => a.localeCompare(b)), [categories]);

  const snapshot = useSyncExternalStore(subscribeToRecentCategories, getRecentCategoriesSnapshot, () => "[]");
  const recent = useMemo(() => {
    try {
      return (JSON.parse(snapshot) as string[]).filter((c) => categories.includes(c));
    } catch {
      return [];
    }
  }, [snapshot, categories]);

  const visible =
    categories.length <= MAX_VISIBLE
      ? alphabetical
      : recent.length > 0
        ? recent.slice(0, MAX_VISIBLE)
        : alphabetical.slice(0, MAX_VISIBLE);

  useEffect(() => {
    // Llegar directo a una categoría (link externo, /categorias, un
    // marcador) también cuenta como "vista", no solo darle clic aquí.
    if (activeCategory) trackCategoryView(activeCategory);
  }, [activeCategory]);

  const buildHref = (category?: string) => ({
    pathname: "/productos",
    query: { ...(category && { category }), ...(sort !== "recientes" && { sort }), ...(q && { q }) },
  });

  return (
    <DragScroll className="flex gap-2 overflow-x-auto pb-1">
      <Link href={buildHref()} className={pillClass(!activeCategory)}>
        Todas
      </Link>
      {visible.map((c) => (
        <Link
          key={c}
          href={buildHref(c)}
          onClick={() => trackCategoryView(c)}
          className={pillClass(activeCategory === c)}
        >
          {c}
        </Link>
      ))}
      <Link
        href="/categorias"
        className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
      >
        Ver todas <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </DragScroll>
  );
}
