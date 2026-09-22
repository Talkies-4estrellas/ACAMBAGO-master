import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  DEMO_ALL_PRODUCTS,
  DEMO_ALL_BUSINESSES_LIST,
  DEMO_PRODUCT_EXTRAS,
} from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import {
  Star,
  MessageCircle,
  ChevronRight,
  Package,
  Truck,
  BadgeCheck,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import ProductGallery from "./ProductGallery";
import TrackRecentlyViewed from "./TrackRecentlyViewed";
import ProductQA from "./ProductQA";
import AddToCartButton from "@/components/ui/AddToCartButton";
import MessageSellerButton from "@/components/ui/MessageSellerButton";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product = DEMO_ALL_PRODUCTS.find((p) => p.id === id) ?? null;
  const isDemoProduct = !!product;
  let business = isDemoProduct ? DEMO_ALL_BUSINESSES_LIST.find((b) => b.id === product!.business_id) ?? null : null;
  let related = isDemoProduct
    ? DEMO_ALL_PRODUCTS.filter((p) => p.business_id === product!.business_id && p.id !== id).slice(0, 6)
    : [];
  let questions: import("@/types").ProductQuestion[] = [];

  if (!isDemoProduct) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      if (url && !url.includes("your-project") && url !== "https://placeholder.supabase.co") {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data } = await supabase.from("products").select("*").eq("id", id).eq("is_draft", false).single();
        if (data) {
          product = data;
          const [{ data: bizData }, { data: relatedData }, { data: questionsData }] = await Promise.all([
            supabase.from("businesses").select("*").eq("id", data.business_id).single(),
            supabase.from("products").select("*").eq("business_id", data.business_id).eq("is_available", true).eq("is_draft", false).neq("id", id).limit(6),
            supabase.from("product_questions").select("*").eq("product_id", id).order("created_at", { ascending: false }),
          ]);
          business = bizData ?? null;
          related = relatedData ?? [];
          questions = questionsData ?? [];
        }
      }
    } catch {}
  }

  if (!product) notFound();

  const extra = DEMO_PRODUCT_EXTRAS[id];
  const images = extra?.images?.length
    ? extra.images
    : product.image_urls?.length
    ? product.image_urls
    : product.image_url
    ? [product.image_url]
    : [FALLBACK_IMAGE];

  const discount = extra?.original_price
    ? Math.round((1 - product.price / extra.original_price) * 100)
    : null;

  const whatsappUrl = business?.whatsapp
    ? `https://wa.me/52${business.whatsapp}?text=${encodeURIComponent(`Hola, vi el producto "${product.name}" en Acom-Di y me interesa.`)}`
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
      <TrackRecentlyViewed
        item={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: images[0],
          business_id: product.business_id,
          business_name: business?.name ?? "Tienda",
          business_category: business?.category ?? "Otro",
        }}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-gray-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        {business && (
          <>
            <Link
              href={`/?category=${encodeURIComponent(business.category)}`}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {business.category}
            </Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <Link
              href={`/business/${business.id}`}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {business.name}
            </Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          </>
        )}
        <span className="text-slate-600 dark:text-gray-300 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Galería */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProductGallery images={images} name={product.name} />
        </div>

        {/* Info del producto */}
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {extra?.condition && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                {extra.condition}
              </span>
            )}
            {discount && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30">
                {discount}% OFF
              </span>
            )}
            {extra && extra.stock <= 5 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                Últimas {extra.stock} unidades
              </span>
            )}
            {!extra && product.stock_quantity != null && product.stock_quantity === 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                Agotado
              </span>
            )}
            {!extra && product.stock_quantity != null && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                Últimas {product.stock_quantity} unidades
              </span>
            )}
          </div>

          {/* Nombre */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {product.name}
          </h1>

          {/* Rating del negocio */}
          {business && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(business.rating_avg)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                {business.rating_avg.toFixed(1)}
              </span>
              <span className="text-sm text-slate-400 dark:text-gray-500">
                ({business.rating_count} opiniones)
              </span>
            </div>
          )}

          {/* Precio */}
          <div className="space-y-1">
            {extra?.original_price && (
              <p className="text-sm text-slate-400 dark:text-gray-500 line-through">
                {formatPrice(extra.original_price)}
              </p>
            )}
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-slate-900 dark:text-white">
                {formatPrice(product.price)}
              </p>
              {discount && (
                <span className="text-lg font-bold text-orange-500 dark:text-orange-400">
                  -{discount}%
                </span>
              )}
            </div>
            {extra?.original_price && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Ahorras {formatPrice(extra.original_price - product.price)}
              </p>
            )}
          </div>

          {/* Envío */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
            <Truck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              Entrega disponible en Acámbaro
            </p>
          </div>

          {/* Stock */}
          {extra && (
            <p className="text-sm text-slate-500 dark:text-gray-400">
              <span className="font-semibold text-slate-700 dark:text-gray-300">{extra.stock}</span> disponibles
            </p>
          )}
          {!extra && product.stock_quantity != null && (
            <p className="text-sm text-slate-500 dark:text-gray-400">
              <span className="font-semibold text-slate-700 dark:text-gray-300">{product.stock_quantity}</span> disponibles
            </p>
          )}

          {/* Botones */}
          <div className="space-y-3 pt-1">
            <AddToCartButton
              product={{ id: product.id, business_id: product.business_id, name: product.name, price: product.price, image_url: images[0] }}
              disabled={!extra && product.stock_quantity === 0}
            />
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-white/15 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                Contactar por WhatsApp
              </a>
            )}
            {!isDemoProduct && business && (
              <MessageSellerButton businessId={business.id} productId={product.id} productName={product.name} />
            )}
          </div>

          {/* Garantías */}
          <div className="grid grid-cols-1 gap-3 pt-1">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <Package className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <p className="text-xs text-slate-600 dark:text-gray-400">Producto en tienda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Características */}
          {extra?.features?.length && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                Características principales
              </h2>
              <ul className="space-y-2">
                {extra.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Descripción */}
          {product.description && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">
                Descripción
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Preguntas y respuestas (solo productos reales) */}
          {!isDemoProduct && business && (
            <ProductQA
              productId={product.id}
              productName={product.name}
              businessId={business.id}
              businessOwnerId={business.owner_id}
              initialQuestions={questions}
            />
          )}
        </div>

        {/* Sidebar: Vendedor */}
        <div className="space-y-4">
          {business && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Vendedor
              </h3>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 flex-shrink-0">
                  {business.image_url ? (
                    <Image src={business.image_url} alt={business.name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{business.name}</p>
                    <BadgeCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-500">{business.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">
                      {business.rating_avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">({business.rating_count})</span>
                  </div>
                </div>
              </div>
              {business.address && (
                <div className="flex items-start gap-1.5 mb-4 text-xs text-slate-500 dark:text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <span>{business.address}</span>
                </div>
              )}
              <div className="space-y-2">
                <Link
                  href={`/business/${business.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/15 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Ver tienda completa
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                {business.latitude != null && business.longitude != null && (
                  <Link
                    href={`/map?business=${business.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/15 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Ver en el mapa
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Más de esta tienda */}
          {related.length > 0 && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Más de esta tienda
              </h3>
              <div className="space-y-3">
                {related.map((rel) => {
                  const relExtra = DEMO_PRODUCT_EXTRAS[rel.id];
                  const relImg = relExtra?.images?.[0] ?? rel.image_url ?? FALLBACK_IMAGE;
                  return (
                    <Link
                      key={rel.id}
                      href={`/product/${rel.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 flex-shrink-0">
                        <Image src={relImg} alt={rel.name} width={48} height={48} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 dark:text-gray-200 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {rel.name}
                        </p>
                        <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                          {formatPrice(rel.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
