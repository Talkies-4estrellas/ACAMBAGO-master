import BusinessCard from "@/components/business/BusinessCard";
import ProductsReel from "@/components/ui/ProductsReel";
import HeroCarousel from "@/components/ui/HeroCarousel";
import QuickAccessRow from "@/components/ui/QuickAccessRow";
import DragScroll from "@/components/ui/DragScroll";
import CategoriesReel from "@/components/ui/CategoriesReel";
import { Business } from "@/types";
import { getCategoryTree } from "@/lib/categories";
import {
  DEMO_BUSINESSES, DEMO_BUSINESSES_EXTRA, DEMO_ALL_PRODUCTS,
  DEMO_PRODUCTS, DEMO_PRODUCTS_ROPA, DEMO_PRODUCTS_ELECTRONICA,
  DEMO_PRODUCTS_ZAPATERIA, DEMO_PRODUCTS_JOYERIA, DEMO_PRODUCTS_ARTESANIAS, DEMO_PRODUCTS_DEPORTES,
  DEMO_PRODUCTS_HERBOLARIA, DEMO_PRODUCTS_COMPUTACION, DEMO_PRODUCTS_FLORISTERIA, DEMO_PRODUCTS_ABARROTES,
} from "@/lib/demo-data";

const ALL_DEMO_BUSINESSES = [...DEMO_BUSINESSES, ...DEMO_BUSINESSES_EXTRA];
import Link from "next/link";
import { MapPin, Ticket, Star, ArrowRight, Truck, Store, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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

async function getBusinesses(category?: string, search?: string, homeDelivery?: boolean): Promise<Business[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    let query = supabase
      .from("businesses").select("*")
      .eq("is_approved", true).eq("is_active", true)
      .order("rating_avg", { ascending: false });
    if (category) query = query.eq("category", category);
    if (homeDelivery) query = query.eq("home_enabled", true);
    if (search) {
      // Comas y paréntesis rompen la sintaxis de .or() de PostgREST, se limpian antes de armar el filtro.
      const term = search.replace(/[,()]/g, " ").trim();
      if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
    }
    const { data } = await query.limit(24);
    return (data ?? []) as Business[];
  } catch { return []; }
}

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

async function getFeaturedProducts(): Promise<ReelItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_featured_products", { p_limit: 15 });
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

// Busca productos (no solo negocios) que coincidan con el termino de
// busqueda, para poder responder "que tienda tiene tal producto" — antes,
// buscar "taladro" solo encontraba negocios cuyo nombre/descripcion mencionara
// esa palabra, nunca los productos reales de su catalogo.
async function getProductSearchResults(search: string): Promise<ReelItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return [];
  const term = search.replace(/[,()]/g, " ").trim();
  if (!term) return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, businesses!inner(id, name, category, is_approved, is_active)")
      .eq("is_available", true)
      .eq("businesses.is_approved", true)
      .eq("businesses.is_active", true)
      .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(24);

    return ((data ?? []) as unknown as {
      id: string; name: string; price: number; image_url: string | null; image_urls: string[] | null;
      business_id: string; businesses: { name: string; category: string };
      stock_quantity: number | null; is_available: boolean;
    }[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image_url || p.image_urls?.[0] || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
      business_id: p.business_id,
      business_name: p.businesses.name,
      business_category: p.businesses.category,
      stock_quantity: p.stock_quantity,
      is_available: p.is_available,
    }));
  } catch { return []; }
}

const demoBusinessById = new Map(ALL_DEMO_BUSINESSES.map((b) => [b.id, b]));

function getDemoProductSearchResults(search: string): ReelItem[] {
  const term = search.toLowerCase();
  return DEMO_ALL_PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
  ).flatMap((p) => {
    const biz = demoBusinessById.get(p.business_id);
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
}

// DEMO_FEATURED es un respaldo solo para cuando no hay credenciales reales
// de Supabase configuradas (modo demo puro); con credenciales reales,
// "Productos Destacados" siempre sale de getFeaturedProducts().
const DEMO_FEATURED = [
  { ...DEMO_PRODUCTS[0],        business_name: "Ferretería Acámbaro",     business_category: "Ferretería",   image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80" },
  { ...DEMO_PRODUCTS_ROPA[0],   business_name: "Boutique Acámbaro",       business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
  { ...DEMO_PRODUCTS_ELECTRONICA[0], business_name: "TechStore Acámbaro", business_category: "Electrónica", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
  { ...DEMO_PRODUCTS_ROPA[1],   business_name: "Boutique Acámbaro",       business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80" },
  { ...DEMO_PRODUCTS_ZAPATERIA[0], business_name: "Zapatería El Paso",    business_category: "Zapatería",   image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { ...DEMO_PRODUCTS_JOYERIA[0],  business_name: "Joyería Acámbaro Gold", business_category: "Joyería",     image: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400&q=80" },
  { ...DEMO_PRODUCTS_ROPA[2],   business_name: "Boutique Acámbaro",       business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80" },
  { ...DEMO_PRODUCTS_ELECTRONICA[3], business_name: "TechStore Acámbaro", business_category: "Electrónica", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" },
  { ...DEMO_PRODUCTS_ARTESANIAS[0], business_name: "Artesanías de Acámbaro", business_category: "Artesanías", image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&q=80" },
  { ...DEMO_PRODUCTS_DEPORTES[0],     business_name: "Deportes Acámbaro",       business_category: "Deportes",    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80" },
  { ...DEMO_PRODUCTS_ROPA[3],   business_name: "Boutique Acámbaro",       business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80" },
  { ...DEMO_PRODUCTS_HERBOLARIA[0],   business_name: "Herbolaria y Naturista Verde", business_category: "Farmacia", image: "https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=400&q=80" },
  { ...DEMO_PRODUCTS_COMPUTACION[0],  business_name: "Computación Pro",         business_category: "Electrónica", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80" },
  { ...DEMO_PRODUCTS_FLORISTERIA[0],  business_name: "Floristería Las Margaritas", business_category: "Otro",     image: "https://images.unsplash.com/photo-1512056495345-913a0c261dc8?w=400&q=80" },
  { ...DEMO_PRODUCTS_ABARROTES[0],    business_name: "Abarrotes La Esquina",    business_category: "Abarrotes",   image: "https://images.unsplash.com/photo-1699377179823-d5975d237b4e?w=400&q=80" },
];

const FEATURED_CATEGORIES = [
  { name: "Tienda de ropa", emoji: "👗", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80", desc: "Moda para toda la familia" },
  { name: "Electrónica",    emoji: "📱", image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=400&q=80", desc: "Gadgets y accesorios" },
  { name: "Joyería",        emoji: "💍", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80", desc: "Plata, oro y fantasía" },
  { name: "Accesorios",     emoji: "👜", image: "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=400&q=80", desc: "Bolsas, lentes y más" },
  { name: "Zapatería",      emoji: "👟", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", desc: "Calzado para todos" },
  { name: "Artesanías",     emoji: "🏺", image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&q=80", desc: "Hecho a mano en Acámbaro" },
  { name: "Deportes",       emoji: "⚽", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80", desc: "Equipo y ropa deportiva" },
  { name: "Farmacia",       emoji: "💊", image: "https://images.unsplash.com/photo-1611072965169-e1534f6f300c?w=400&q=80", desc: "Medicamentos y salud" },
  { name: "Ferretería",     emoji: "🔧", image: "https://images.unsplash.com/photo-1631856954655-966f97d809de?w=400&q=80", desc: "Herramientas y materiales" },
  { name: "Papelería",      emoji: "📓", image: "https://images.unsplash.com/photo-1509528640600-be205362320b?w=400&q=80", desc: "Todo para la escuela y oficina" },
  { name: "Mueblería",      emoji: "🛋️", image: "https://images.unsplash.com/photo-1634712282287-14ed57b9cc89?w=400&q=80", desc: "Muebles para tu hogar" },
  { name: "Abarrotes",      emoji: "🛒", image: "https://images.unsplash.com/photo-1699377179823-d5975d237b4e?w=400&q=80", desc: "Lo esencial de la despensa" },
  { name: "Cosméticos",     emoji: "💄", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80", desc: "Belleza y cuidado personal" },
  { name: "Mascotas",       emoji: "🐾", image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80", desc: "Todo para tu mascota" },
  { name: "Juguetería",     emoji: "🧸", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&q=80", desc: "Diversión para los niños" },
  { name: "Librería",       emoji: "📚", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&q=80", desc: "Libros para todas las edades" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; delivery?: string }>;
}) {
  const params = await searchParams;
  const wantsHomeDelivery = params.delivery === "domicilio";
  const supabaseBusinesses = await getBusinesses(params.category, params.q, wantsHomeDelivery);
  const realFeatured = await getFeaturedProducts();
  const categoryNames = await getRootCategoryNames();
  const featured = realFeatured.length > 0 ? realFeatured : DEMO_FEATURED;
  const query = params.q?.toLowerCase() ?? "";
  const cat = params.category ?? "";

  const filteredDemos = ALL_DEMO_BUSINESSES.filter((b) => {
    const matchesCat = !cat || b.category === cat;
    const matchesQuery = !query || b.name.toLowerCase().includes(query) || b.description?.toLowerCase().includes(query) || b.category.toLowerCase().includes(query);
    // Los negocios demo no traen home_enabled propio; igual que en la base
    // real (default true), se cuentan como disponibles salvo que digan false.
    const matchesDelivery = !wantsHomeDelivery || b.home_enabled !== false;
    return matchesCat && matchesQuery && matchesDelivery;
  });

  const businesses: Business[] = [
    ...filteredDemos,
    ...supabaseBusinesses.filter((b) => !b.id.startsWith("demo")),
  ];

  // Solo con texto de búsqueda (no con filtro de sola categoría): muestra
  // qué tiendas tienen el producto buscado, no solo negocios que lo
  // mencionen en su nombre/descripción.
  const demoProductResults = query ? getDemoProductSearchResults(query) : [];
  const realProductResults = params.q ? await getProductSearchResults(params.q) : [];
  const productResults: ReelItem[] = [...demoProductResults, ...realProductResults];

  const totalCount = businesses.length;
  const isFiltered = !!(params.category || params.q || wantsHomeDelivery);
  // Al filtrar solo por categoría (sin búsqueda de texto) no hace falta el
  // hero ni los accesos rápidos: así el resultado aparece arriba de inmediato
  // en vez de que el usuario tenga que bajar para verlo. Si hay búsqueda de
  // texto se conservan, porque ahí vive la barra de búsqueda para editarla.
  const hideHero = isFiltered && !query;

  return (
    <>
      {!hideHero && (
        <>
          {/* ── Hero: carrusel estilo Mercado Libre ── */}
          <HeroCarousel defaultSearch={params.q} totalCount={totalCount} />

          {/* ── Accesos rápidos, estilo Mercado Libre ── */}
          <section className="bg-white dark:bg-[#050e18] py-8 md:py-10 border-b border-slate-100 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4">
              <QuickAccessRow />
            </div>
          </section>
        </>
      )}

      {/* Filtros — solo vista filtrada */}
      {isFiltered && (
        <section className="max-w-7xl mx-auto px-4 pt-8 pb-2">
          <DragScroll className="flex gap-2 overflow-x-auto pb-2">
            <Link href="/" className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${!cat ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-600 border-slate-300 hover:border-brand-400 dark:bg-white/5 dark:text-gray-300 dark:border-white/20 dark:hover:border-brand-400"}`}>
              Todos
            </Link>
            {categoryNames.map((c) => (
              <Link key={c} href={`/?category=${encodeURIComponent(c)}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${cat === c ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-600 border-slate-300 hover:border-brand-400 dark:bg-white/5 dark:text-gray-300 dark:border-white/20 dark:hover:border-brand-400"}`}>
                {c}
              </Link>
            ))}
          </DragScroll>
        </section>
      )}

      {isFiltered ? (
        <div className="max-w-7xl mx-auto px-4 pb-16 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {cat || (wantsHomeDelivery && !query ? "Entrega a domicilio" : "") || `Resultados para "${params.q}"`}
              <span className="ml-2 text-sm font-normal text-slate-400 dark:text-gray-500">({totalCount})</span>
            </h2>
            <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Limpiar filtros</Link>
          </div>

          {/* Que tiendas tienen el producto buscado, no solo negocios que lo
              mencionen por nombre. Solo aplica cuando hay texto de busqueda. */}
          {query && productResults.length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Productos que coinciden ({productResults.length})
              </h3>
              <ProductsReel grid items={productResults} />
            </div>
          )}

          {query && productResults.length > 0 && businesses.length > 0 && (
            <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Tiendas
            </h3>
          )}

          {businesses.length === 0 && productResults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-slate-400 dark:text-gray-400 mb-4">Sin resultados</p>
              <Link href="/" className="btn-primary text-sm">Ver todos</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {businesses.map((b) => <BusinessCard key={b.id} business={b} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Productos Destacados — Reel ── */}
          <section id="productos" className="py-14 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Productos Destacados</h2>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Lo mejor de las tiendas locales de Acámbaro</p>
                </div>
                <Link href="#tiendas" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 border border-slate-200 hover:border-brand-300 dark:border-white/20 dark:hover:border-brand-400/50 px-4 py-2 rounded-xl transition-all">
                  Ver tiendas <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <ProductsReel items={featured} />
          </section>

          {/* ── Explorar por Categoría ── */}
          <section id="categorias" className="py-14 bg-slate-100/80 dark:bg-black/20">
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Explorar por Categoría</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Encuentra exactamente lo que buscas</p>
              </div>

              <CategoriesReel items={FEATURED_CATEGORIES} />

              <DragScroll className="flex gap-2 overflow-x-auto mt-6 pb-1">
                {categoryNames.filter((c) => !FEATURED_CATEGORIES.find((fc) => fc.name === c)).map((c) => (
                  <Link key={c} href={`/?category=${encodeURIComponent(c)}`}
                    className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-brand-400/50 hover:text-brand-600 dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:border-brand-400/50 dark:hover:text-brand-300 transition-all">
                    {c}
                  </Link>
                ))}
              </DragScroll>
            </div>
          </section>

          {/* ── Todas las Tiendas ── */}
          <section id="tiendas" className="py-14 bg-slate-100/80 dark:bg-black/20">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Todas las Tiendas</h2>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{totalCount} tiendas disponibles en Acámbaro</p>
                </div>
                <Link href="/map" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 border border-slate-200 hover:border-brand-300 dark:border-white/20 dark:hover:border-brand-400/50 px-4 py-2 rounded-xl transition-all">
                  <MapPin className="w-3.5 h-3.5" /> Ver en mapa
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {businesses.map((b) => <BusinessCard key={b.id} business={b} />)}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="max-w-7xl mx-auto px-4 py-14">
            <div className="relative overflow-hidden rounded-3xl p-10 text-white text-center border border-brand-500/30"
              style={{ background: "linear-gradient(135deg, #013F4A, #068562)" }}>
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-56 h-56 bg-white rounded-full blur-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2 relative z-10">¿Tienes una tienda en Acámbaro?</h3>
              <p className="text-brand-100 mb-7 max-w-xl mx-auto relative z-10">
                Publica tus productos gratis y llega a más clientes con cupones digitales y perfil propio.
              </p>
              <Link href="/perfil/crear-tienda"
                className="bg-white text-brand-800 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center gap-2 relative z-10">
                Publicar mi tienda gratis <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* ── Por qué Acom-Di ── */}
          <section className="max-w-7xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">¿Por qué comprar en Acom-Di?</h2>
            <p className="text-slate-500 dark:text-gray-400 text-center text-sm mb-10">Conectamos a compradores con los mejores negocios locales de Acámbaro</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Store className="w-6 h-6 text-brand-600 dark:text-brand-400" />, title: "Negocios Locales", desc: "Apoya directamente a los emprendedores de Acámbaro, Guanajuato." },
                { icon: <Ticket className="w-6 h-6 text-brand-600 dark:text-brand-400" />, title: "Cupones con QR", desc: "Descuentos exclusivos canjeables en tienda con tu celular." },
                { icon: <Truck className="w-6 h-6 text-brand-600 dark:text-brand-400" />, title: "Entrega en la Ciudad", desc: "Muchos negocios ofrecen entrega a domicilio en Acámbaro." },
                { icon: <MapPin className="w-6 h-6 text-brand-600 dark:text-brand-400" />, title: "Mapa Interactivo", desc: "Encuentra negocios cerca de ti con nuestro mapa integrado." },
                { icon: <Star className="w-6 h-6 text-brand-600 dark:text-brand-400" />, title: "Reseñas Reales", desc: "Lee opiniones de otros clientes antes de hacer tu compra." },
              ].map((f) => (
                <div key={f.title} className="card p-5 flex gap-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20 flex items-center justify-center flex-shrink-0">{f.icon}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
