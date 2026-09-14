import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { Business, Product, Coupon, Review } from "@/types";
import StarRating from "@/components/business/StarRating";
import CouponCard from "@/components/coupons/CouponCard";
import ReviewSection from "./ReviewSection";
import ShareButton from "@/components/ui/ShareButton";
import MessageSellerButton from "@/components/ui/MessageSellerButton";
import CategoryIcon from "@/components/ui/CategoryIcon";
import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import ProductsReel from "@/components/ui/ProductsReel";
import {
  DEMO_ALL_BUSINESSES_LIST,
  DEMO_ALL_PRODUCTS,
  DEMO_ALL_COUPONS,
  DEMO_ALL_REVIEWS,
} from "@/lib/demo-data";
import { MapPin, Phone, Tag, Package, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { getOrderCompletionRate, getAverageResponseTime } from "@/lib/business-metrics";

export const revalidate = 30;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80";

const CATEGORY_EMOJI: Record<string, string> = {
  "Ferretería": "🔧",
  "Tienda de ropa": "👗",
  "Zapatería": "👟",
  "Electrónica": "📱",
  "Joyería": "💍",
  "Farmacia": "💊",
  "Cosméticos": "💄",
  "Mascotas": "🐾",
  "Papelería": "📚",
  "Mueblería": "🛋️",
  "Artesanías": "🏺",
  "Deportes": "⚽",
  "Abarrotes": "🛒",
  "Juguetería": "🧸",
  "Librería": "📖",
  "Otro": "🏪",
};

async function getSupabaseData(id: string) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!url || url.includes("your-project") || url === "https://placeholder.supabase.co") return null;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const [bizRes, productsRes, couponsRes, reviewsRes, completion, responseTime] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", id).eq("is_approved", true).single(),
      supabase.from("products").select("*").eq("business_id", id).eq("is_available", true),
      supabase.from("coupons").select("*").eq("business_id", id).eq("is_active", true),
      supabase.from("reviews").select("*, profiles(name, avatar_url)").eq("business_id", id).order("created_at", { ascending: false }),
      getOrderCompletionRate(supabase, id),
      getAverageResponseTime(supabase, id),
    ]);

    if (bizRes.error || !bizRes.data) return null;

    return {
      business: bizRes.data as Business,
      products: (productsRes.data ?? []) as Product[],
      coupons: (couponsRes.data ?? []) as Coupon[],
      reviews: (reviewsRes.data ?? []) as Review[],
      completionRate: completion.rate,
      responseTimeLabel: responseTime.label,
    };
  } catch {
    return null;
  }
}

async function hasDeliveredOrder(businessId: string, userId: string): Promise<boolean> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .eq("status", "entregado");
    return !!count;
  } catch {
    return false;
  }
}

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();

  // 1. Buscar en datos demo primero
  const demoBusiness = DEMO_ALL_BUSINESSES_LIST.find((b) => b.id === id);
  if (demoBusiness) {
    const products = DEMO_ALL_PRODUCTS.filter((p) => p.business_id === id);
    const coupons = DEMO_ALL_COUPONS.filter((c) => c.business_id === id);
    const reviews = DEMO_ALL_REVIEWS.filter((r) => r.business_id === id);
    const emoji = CATEGORY_EMOJI[demoBusiness.category] ?? "🏪";
    return (
      <DemoBusinessPage
        business={demoBusiness}
        products={products}
        coupons={coupons}
        reviews={reviews}
        emoji={emoji}
        buyerUserId={userId ?? undefined}
      />
    );
  }

  // 2. Intentar Supabase
  const data = await getSupabaseData(id);
  if (!data) notFound();

  const { business, products, coupons, reviews, completionRate, responseTimeLabel } = data;
  const canReview = userId ? await hasDeliveredOrder(business.id, userId) : false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        ← Volver al inicio
      </Link>

      {/* Header */}
      <div className="card mb-6 overflow-visible">
        <div className="relative h-52 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 rounded-t-2xl overflow-hidden">
          {business.banner_url ? (
            <Image src={business.banner_url} alt="Banner" fill className="object-cover" />
          ) : business.image_url ? (
            <Image src={business.image_url} alt={business.name} fill className="object-cover opacity-40" />
          ) : null}
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-2 border-white overflow-hidden flex items-center justify-center">
            {business.image_url ? (
              <Image src={business.image_url} alt={business.name} width={80} height={80} className="object-cover" />
            ) : (
              <CategoryIcon category={business.category} className="w-8 h-8 text-brand-500" />
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="badge bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                    <Tag className="w-3 h-3 mr-1" />{business.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <StarRating value={Math.round(business.rating_avg)} readonly size="sm" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Number(business.rating_avg).toFixed(1)} ({business.rating_count} reseñas)
                    </span>
                  </div>
                  {completionRate != null && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> {completionRate}% pedidos entregados
                    </span>
                  )}
                  {responseTimeLabel && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Responde en {responseTimeLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {business.whatsapp && (
                  <a href={`https://wa.me/52${business.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                <MessageSellerButton businessId={business.id} variant="solid" />
                <ShareButton businessName={business.name} />
              </div>
            </div>
            {business.description && <p className="text-gray-600 dark:text-gray-300 mt-3">{business.description}</p>}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-3">
              <MapPin className="w-4 h-4 text-brand-500" />{business.address}
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" /> Productos
          </h2>
          <ProductsReel
            grid
            items={products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image_url || p.image_urls?.[0] || FALLBACK_IMAGE,
              business_id: p.business_id,
              business_name: business.name,
              business_category: business.category,
              stock_quantity: p.stock_quantity,
              is_available: p.is_available,
            }))}
          />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ReviewSection businessId={business.id} initialReviews={reviews} canReview={canReview} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🎟️ Cupones disponibles
          </h2>
          {coupons.length === 0 ? (
            <div className="card p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              Sin cupones activos por el momento
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((c) => <CouponCard key={c.id} coupon={c} showQR buyerUserId={userId ?? undefined} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
