import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductsReel from "@/components/ui/ProductsReel";
import { BUSINESS_CATEGORIES } from "@/types";
import { DEMO_ALL_PRODUCTS, DEMO_ALL_BUSINESSES_LIST } from "@/lib/demo-data";

export const revalidate = 60;

interface ReelItem {
  id: string;
  name: string;
  price: number;
  image: string;
  business_id: string;
  business_name: string;
  business_category: string;
  stock_quantity?: number | null;
  is_available?: boolean;
}

async function getProductsForCategories(): Promise<ReelItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_featured_products", { p_limit: 500 });
    return ((data ?? []) as {
      id: string; name: string; price: number; image_url: string | null;
      business_id: string; business_name: string; business_category: string;
      stock_quantity?: number | null; is_available?: boolean;
    }[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image_url ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
      business_id: p.business_id,
      business_name: p.business_name,
      business_category: p.business_category,
      stock_quantity: p.stock_quantity,
      is_available: p.is_available,
    }));
  } catch { return []; }
}

const businessById = new Map(DEMO_ALL_BUSINESSES_LIST.map((b) => [b.id, b]));

const DEMO_PRODUCTS_BY_CATEGORY: ReelItem[] = DEMO_ALL_PRODUCTS.flatMap((p) => {
  const biz = businessById.get(p.business_id);
  if (!biz) return [];
  return [{
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image_url ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
    business_id: biz.id,
    business_name: biz.name,
    business_category: biz.category,
  }];
});

export default async function CategoriasPage() {
  const real = await getProductsForCategories();
  const products = real.length > 0 ? real : DEMO_PRODUCTS_BY_CATEGORY;

  const grouped = new Map<string, ReelItem[]>();
  for (const p of products) {
    const list = grouped.get(p.business_category) ?? [];
    list.push(p);
    grouped.set(p.business_category, list);
  }

  const categoriesWithProducts = BUSINESS_CATEGORIES.filter((c) => (grouped.get(c)?.length ?? 0) > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Inicio
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Categorías</h1>
      <p className="text-slate-500 dark:text-gray-400 mb-8">Explora los productos de cada categoría</p>

      {categoriesWithProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400 dark:text-gray-400">Todavía no hay productos publicados</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categoriesWithProducts.map((cat) => (
            <section key={cat}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{cat}</h2>
                <Link
                  href={`/category/${encodeURIComponent(cat)}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 flex-shrink-0"
                >
                  Ver tiendas <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <ProductsReel items={grouped.get(cat)!} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
