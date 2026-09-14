"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Star, ChevronRight, Package, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ProductsReel from "@/components/ui/ProductsReel";
import { getDemoMode, DEMO_BUYER_FAVORITES, DEMO_BUYER_PRODUCT_FAVORITES } from "@/lib/demo-mode";

type Tab = "productos" | "tiendas";

interface FavoriteStore {
  id: string;
  name: string;
  category: string;
  rating: number;
  address: string;
}

interface FavoriteStoreRow {
  businesses: { id: string; name: string; category: string; rating_avg: number; address: string } | null;
}

interface FavoriteProduct {
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

interface FavoriteProductRow {
  products: {
    id: string; name: string; price: number; image_url: string | null; business_id: string;
    stock_quantity: number | null; is_available: boolean;
    businesses: { name: string; category: string } | null;
  } | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function FavoritosPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("productos");
  const [favoriteStores, setFavoriteStores] = useState<FavoriteStore[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const demoMode = getDemoMode();

  useEffect(() => {
    if (demoMode === "buyer" || IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    const supabase = createClient();

    const loadStores = supabase
      .from("business_favorites")
      .select("businesses(id, name, category, rating_avg, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const loadProducts = supabase
      .from("product_favorites")
      .select("products(id, name, price, image_url, business_id, stock_quantity, is_available, businesses(name, category))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    Promise.all([loadStores, loadProducts]).then(([storesRes, productsRes]) => {
      const stores: FavoriteStore[] = [];
      for (const row of (storesRes.data ?? []) as unknown as FavoriteStoreRow[]) {
        const b = row.businesses;
        if (!b) continue;
        stores.push({ id: b.id, name: b.name, category: b.category, rating: Number(b.rating_avg) || 0, address: b.address });
      }
      setFavoriteStores(stores);

      const products: FavoriteProduct[] = [];
      for (const row of (productsRes.data ?? []) as unknown as FavoriteProductRow[]) {
        const p = row.products;
        if (!p || !p.businesses) continue;
        products.push({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.image_url ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
          business_id: p.business_id,
          business_name: p.businesses.name,
          business_category: p.businesses.category,
          stock_quantity: p.stock_quantity,
          is_available: p.is_available,
        });
      }
      setFavoriteProducts(products);

      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const stores = demoMode === "buyer" || IS_DEMO ? DEMO_BUYER_FAVORITES : favoriteStores;
  const products = demoMode === "buyer" || IS_DEMO ? DEMO_BUYER_PRODUCT_FAVORITES : favoriteProducts;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Favoritos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Lo que marcaste con el corazón</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setTab("productos")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "productos"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          Productos {products.length > 0 && `(${products.length})`}
        </button>
        <button
          onClick={() => setTab("tiendas")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "tiendas"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          Tiendas {stores.length > 0 && `(${stores.length})`}
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>
      ) : tab === "productos" ? (
        products.length === 0 ? (
          <div className="card p-10 text-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Todavía no tienes productos favoritos.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Toca el corazón en un producto para guardarlo aquí.</p>
          </div>
        ) : (
          <ProductsReel items={products} grid />
        )
      ) : stores.length === 0 ? (
        <div className="card p-10 text-center">
          <Heart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no tienes tiendas favoritas.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Toca el corazón en una tienda para agregarla aquí.</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-white/10">
          {stores.map((s) => (
            <Link key={s.id} href={`/business/${s.id}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <CategoryIcon category={s.category} className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {s.category}
                  </span>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" /> {s.rating}
                  </span>
                </div>
                {s.address && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/map?business=${s.id}`);
                    }}
                    title="Ver en el mapa"
                    className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mt-1"
                  >
                    <MapPin className="w-3 h-3 text-brand-500 dark:text-brand-400 flex-shrink-0" />
                    <span className="truncate max-w-[220px] underline decoration-dotted">{s.address}</span>
                  </button>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
