import { Business, Product, Coupon, Review } from "@/types";
import StarRating from "@/components/business/StarRating";
import CouponCard from "@/components/coupons/CouponCard";
import ShareButton from "@/components/ui/ShareButton";
import ProductsReel from "@/components/ui/ProductsReel";
import { DEMO_PRODUCT_EXTRAS } from "@/lib/demo-data";
import { MapPin, Phone, Tag, Package, MessageSquare, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80";

interface Props {
  business: Business;
  products: Product[];
  coupons: Coupon[];
  reviews: Review[];
  emoji: string;
  productLabel?: string;
  buyerUserId?: string;
}

export default function DemoBusinessPage({
  business,
  products,
  coupons,
  reviews,
  emoji,
  productLabel = "Productos y servicios",
  buyerUserId,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="h-52 rounded-t-2xl overflow-hidden relative flex items-end p-6 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30">
          {business.image_url && (
            <Image
              src={business.image_url}
              alt={business.name}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-4xl -mb-10">
            {emoji}
          </div>
        </div>
        <div className="px-6 pb-6 pt-12">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="badge bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                  <Tag className="w-3 h-3 mr-1" />
                  {business.category}
                </span>
                <div className="flex items-center gap-1">
                  <StarRating value={Math.round(business.rating_avg)} readonly size="sm" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Number(business.rating_avg).toFixed(1)} ({business.rating_count} reseñas)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {business.whatsapp && (
                <a
                  href={`https://wa.me/52${business.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Contactar por WhatsApp
                </a>
              )}
              <ShareButton businessName={business.name} />
            </div>
          </div>

          {business.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-3">{business.description}</p>
          )}

          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-3">
            <MapPin className="w-4 h-4 text-brand-500" />
            {business.address}
          </div>
        </div>
      </div>

      {/* Products / Services */}
      {products.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            {productLabel}
          </h2>
          <ProductsReel
            grid
            items={products.map((p) => {
              const extra = DEMO_PRODUCT_EXTRAS[p.id];
              const gallery = extra?.images?.length ? extra.images : p.image_url ? [p.image_url] : [];
              return {
                id: p.id,
                name: p.name,
                price: p.price,
                image: gallery[0] || FALLBACK_IMAGE,
                business_id: p.business_id,
                business_name: business.name,
                business_category: business.category,
              };
            })}
          />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Reviews */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" />
              Reseñas ({reviews.length})
            </h2>

            <div className="card p-4 mb-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                🔒{" "}
                <Link href="/register" className="text-brand-600 dark:text-brand-400 hover:underline">
                  Regístrate
                </Link>{" "}
                para dejar una reseña
              </p>
            </div>

            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {r.profiles?.name ?? "Usuario"}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <StarRating value={r.rating} readonly size="sm" />
                      {r.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: Coupons */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎟️ Cupones disponibles</h2>
          {coupons.length === 0 ? (
            <div className="card p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
              Sin cupones activos por el momento
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((c) => (
                <CouponCard key={c.id} coupon={c} showQR buyerUserId={buyerUserId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
