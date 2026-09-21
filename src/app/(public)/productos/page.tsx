import Link from "next/link";
import { Package, ArrowLeft, Search } from "lucide-react";
import ProductsReel from "@/components/ui/ProductsReel";
import DragScroll from "@/components/ui/DragScroll";
import CategoryChips from "./CategoryChips";
import { getCategoryTree } from "@/lib/categories";

export const revalidate = 60;

// Igual a las 17 categorías fijas de antes (BUSINESS_CATEGORIES) — ahora
// solo se usa como respaldo en modo demo, cuando no hay tabla de
// categorías real que consultar.
const DEMO_CATEGORY_NAMES = [
  "Tienda de ropa", "Zapatería", "Farmacia", "Ferretería", "Papelería",
  "Electrónica", "Joyería", "Accesorios", "Mueblería", "Abarrotes",
  "Cosméticos", "Mascotas", "Artesanías", "Deportes", "Juguetería", "Librería", "Otro",
];

async function getRootCategoryNames(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return DEMO_CATEGORY_NAMES;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const tree = await getCategoryTree(supabase);
    return tree.length > 0 ? tree.map((c) => c.name) : DEMO_CATEGORY_NAMES;
  } catch { return DEMO_CATEGORY_NAMES; }
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";

// Sin paginación por ahora: se limita a 15 filas al máximo de columnas del
// grid (6, en xl:); en breakpoints con menos columnas, la misma cantidad de
// productos simplemente ocupa más filas, nunca menos contenido.
const GRID_COLS = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
const MAX_COLS = 6;
const ROWS_LIMIT = 15;
const PRODUCTS_LIMIT = MAX_COLS * ROWS_LIMIT;

type Sort = "recientes" | "precio_asc" | "precio_desc" | "vendidos";

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "vendidos", label: "Más vendidos" },
];

interface ProductItem {
  id: string; name: string; price: number; image: string;
  business_id: string; business_name: string; business_category: string;
  stock_quantity: number | null; is_available: boolean;
}

// Categorías de un producto: las propias si ya tiene (supabase/product-
// categories.sql corrido), o la de su tienda como respaldo para filas que
// todavía no se hayan migrado. Un producto puede pertenecer a varias.
function productCategories(p: { categories?: string[] | null; business_category: string }): string[] {
  return p.categories?.length ? p.categories : [p.business_category];
}

// "Más vendidos" viene de un RPC aparte (ranking real por ventas, no una
// columna de `products`), así que no se puede pedir con el mismo
// select+order que el resto de los filtros. Se resuelve categoría/búsqueda
// filtrando en memoria sobre el resultado del RPC — el propio `p_limit` ya
// lo mantiene chico, así que no es un problema de rendimiento.
async function getBestSellers(category?: string, q?: string): Promise<ProductItem[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_featured_products", { p_limit: PRODUCTS_LIMIT });

  let rows = (data ?? []) as (ProductItem & { image_url: string | null; categories?: string[] | null })[];
  if (category) rows = rows.filter((p) => productCategories(p).includes(category));
  if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return rows.map((p) => ({ ...p, image: p.image_url ?? FALLBACK_IMAGE }));
}

// Categorías con al menos un producto disponible ahora mismo — para no
// mostrar pastillas que lleven a un callejón sin salida ("no hay productos
// en X"). Independiente del filtro/orden/búsqueda activos: siempre refleja
// el catálogo completo, para que las demás pastillas sigan siendo
// alcanzables sin perder de vista qué categorías sí tienen contenido.
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

    const categories = ((data ?? []) as unknown as { categories: string[] | null; businesses: { category: string } }[])
      .flatMap((p) => productCategories({ categories: p.categories, business_category: p.businesses.category }));
    return new Set(categories);
  } catch { return new Set(); }
}

async function getAllProducts(category?: string, sort: Sort = "recientes", q?: string): Promise<ProductItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return [];
  try {
    if (sort === "vendidos") return getBestSellers(category, q);

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*, businesses!inner(id, name, category, is_approved, is_active)")
      .eq("is_available", true)
      .eq("businesses.is_approved", true)
      .eq("businesses.is_active", true);

    if (category) query = query.contains("categories", [category]);
    if (q) query = query.ilike("name", `%${q}%`);

    const orderColumn = sort === "precio_asc" || sort === "precio_desc" ? "price" : "created_at";
    const ascending = sort === "precio_asc";

    const { data } = await query
      .order(orderColumn, { ascending })
      .limit(PRODUCTS_LIMIT);

    return ((data ?? []) as unknown as {
      id: string; name: string; price: number; image_url: string | null; image_urls: string[] | null;
      business_id: string; businesses: { name: string; category: string };
      stock_quantity: number | null; is_available: boolean;
    }[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image_url || p.image_urls?.[0] || FALLBACK_IMAGE,
      business_id: p.business_id,
      business_name: p.businesses.name,
      business_category: p.businesses.category,
      stock_quantity: p.stock_quantity,
      is_available: p.is_available,
    }));
  } catch { return []; }
}

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const q = params.q?.trim() || undefined;
  const sort: Sort = SORT_OPTIONS.some((o) => o.value === params.sort) ? (params.sort as Sort) : "recientes";
  const [items, categoriesWithProducts, rootNames] = await Promise.all([
    getAllProducts(category, sort, q),
    getCategoriesWithProducts(),
    getRootCategoryNames(),
  ]);
  const visibleCategories = rootNames.filter((c) => categoriesWithProducts.has(c));

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Todos los productos</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">El catálogo completo de las tiendas locales de Acámbaro</p>
        </div>
      </div>

      <div className="card p-4 sm:p-5 mb-6 space-y-4">
        <form action="/productos" method="get" className="relative max-w-md">
          {category && <input type="hidden" name="category" value={category} />}
          {sort !== "recientes" && <input type="hidden" name="sort" value={sort} />}
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar en el catálogo..."
            className="input pl-9"
          />
        </form>

        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide mb-2">Categoría</p>
          <CategoryChips categories={visibleCategories} activeCategory={category} sort={sort} q={q} />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide mb-2">Ordenar por</p>
          <DragScroll className="flex gap-2 overflow-x-auto pb-1">
            {SORT_OPTIONS.map((o) => (
              <Link
                key={o.value}
                href={{ pathname: "/productos", query: { ...(category && { category }), ...(o.value !== "recientes" && { sort: o.value }), ...(q && { q }) } }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  sort === o.value
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-white/30"
                }`}
              >
                {o.label}
              </Link>
            ))}
          </DragScroll>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-14 text-center">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">
            {q ? `Sin resultados para "${q}"` : category ? `Todavía no hay productos en "${category}"` : "Todavía no hay productos publicados"}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Vuelve pronto, las tiendas suben productos nuevos seguido</p>
        </div>
      ) : (
        <ProductsReel grid items={items} cols={GRID_COLS} />
      )}
    </div>
  );
}
