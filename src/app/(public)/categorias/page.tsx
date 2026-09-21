import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { getCategoryTree } from "@/lib/categories";
import { DEMO_ALL_PRODUCTS, DEMO_ALL_BUSINESSES_LIST } from "@/lib/demo-data";

export const revalidate = 60;

// Nombres de categoría raíz (sin subcategorías) — reemplaza a la lista fija
// BUSINESS_CATEGORIES de antes, ahora viene de la tabla dinámica.
async function getRootCategoryNames(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const tree = await getCategoryTree(supabase);
    return tree.map((c) => c.name);
  } catch { return []; }
}

// Solo el nombre de la categoría, no sus productos: no lleva pastillas ni
// tarjetas, es la lista completa (alfabética) que sirve de escape para las
// categorías que el tope de 6 de /productos oculta de su fila de pastillas.
async function getCategoriesWithProducts(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return new Set();
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("categories, businesses!inner(category, is_approved, is_active)")
      .eq("is_available", true)
      .eq("businesses.is_approved", true)
      .eq("businesses.is_active", true);

    // Categorías propias del producto si ya las tiene; si no, la de su
    // tienda como respaldo (filas de antes de correr product-categories.sql).
    const categories = ((data ?? []) as unknown as { categories: string[] | null; businesses: { category: string } }[])
      .flatMap((p) => (p.categories?.length ? p.categories : [p.businesses.category]));
    return new Set(categories);
  } catch { return new Set(); }
}

const businessById = new Map(DEMO_ALL_BUSINESSES_LIST.map((b) => [b.id, b]));
const DEMO_CATEGORIES_WITH_PRODUCTS = new Set(
  DEMO_ALL_PRODUCTS.map((p) => businessById.get(p.business_id)?.category).filter((c): c is string => Boolean(c))
);

export default async function CategoriasPage() {
  const [rootNames, real] = await Promise.all([getRootCategoryNames(), getCategoriesWithProducts()]);
  const categoriesWithProducts = real.size > 0 ? real : DEMO_CATEGORIES_WITH_PRODUCTS;
  const allNames = rootNames.length > 0 ? rootNames : Array.from(DEMO_CATEGORIES_WITH_PRODUCTS);
  const categories = allNames.filter((c) => categoriesWithProducts.has(c)).sort((a, b) => a.localeCompare(b));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Inicio
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Categorías</h1>
      <p className="text-slate-500 dark:text-gray-400 mb-8">Elige una categoría para ver sus tiendas</p>

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400 dark:text-gray-400">Todavía no hay productos publicados</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-white/10 overflow-hidden">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/category/${encodeURIComponent(cat)}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <CategoryIcon category={cat} className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{cat}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
