import Link from "next/link";
import { Ticket, ArrowRight, Tag, Clock, Store } from "lucide-react";
import {
  DEMO_BUSINESSES, DEMO_BUSINESSES_EXTRA,
  DEMO_COUPONS, DEMO_COUPONS_LAVADO, DEMO_COUPONS_CERRAJERO, DEMO_COUPONS_PINTOR,
  DEMO_COUPONS_SALON, DEMO_COUPONS_FARMACIA, DEMO_COUPONS_TALLER, DEMO_COUPONS_VETERINARIA,
  DEMO_COUPONS_PAPELERIA, DEMO_COUPONS_MUEBLES, DEMO_COUPONS_ARTESANIAS, DEMO_COUPONS_DEPORTES,
  DEMO_COUPONS_EXTRA,
} from "@/lib/demo-data";
import { Coupon, Business } from "@/types";

const DEMO_BUSINESSES_ALL = [...DEMO_BUSINESSES, ...DEMO_BUSINESSES_EXTRA];

const ALL_DEMO_COUPONS: Coupon[] = [
  ...DEMO_COUPONS, ...DEMO_COUPONS_LAVADO, ...DEMO_COUPONS_CERRAJERO, ...DEMO_COUPONS_PINTOR,
  ...DEMO_COUPONS_SALON, ...DEMO_COUPONS_FARMACIA, ...DEMO_COUPONS_TALLER, ...DEMO_COUPONS_VETERINARIA,
  ...DEMO_COUPONS_PAPELERIA, ...DEMO_COUPONS_MUEBLES, ...DEMO_COUPONS_ARTESANIAS, ...DEMO_COUPONS_DEPORTES,
  ...DEMO_COUPONS_EXTRA,
];

type CouponWithBusiness = Coupon & { business?: Pick<Business, "id" | "name"> };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

async function getRealCoupons(): Promise<CouponWithBusiness[]> {
  if (IS_DEMO) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("coupons")
    .select("*, businesses!inner(id, name, is_approved, is_active)")
    .eq("is_active", true)
    .eq("businesses.is_approved", true)
    .eq("businesses.is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as (Coupon & { businesses: { id: string; name: string } })[]).map((c) => {
    const { businesses, ...coupon } = c;
    return { ...coupon, business: { id: businesses.id, name: businesses.name } };
  });
}

function CouponCard({ coupon }: { coupon: CouponWithBusiness }) {
  const business = coupon.business ?? DEMO_BUSINESSES_ALL.find((b) => b.id === coupon.business_id);
  const isPercent = coupon.discount_type === "percent";
  const discountLabel = isPercent ? `${coupon.value}% OFF` : `$${coupon.value} OFF`;
  const expires = coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : null;

  const cardContent = (
    <>
      {/* Header con degradado */}
      <div className="relative h-24 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-2 w-20 h-20 bg-white rounded-full blur-2xl" />
        </div>
        <span className="text-3xl font-black text-white relative z-10">{discountLabel}</span>
        {/* Muesca lateral izquierda */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-10 bg-white dark:bg-[#050e18] rounded-r-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-10 bg-white dark:bg-[#050e18] rounded-l-full" />
      </div>

      {/* Línea punteada divisor */}
      <div className="border-t-2 border-dashed border-slate-200 dark:border-white/10 mx-4" />

      {/* Contenido */}
      <div className="p-4 space-y-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">{coupon.title}</p>
          {coupon.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{coupon.description}</p>
          )}
        </div>

        {business && (
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 group-hover:underline">
            <Store className="w-3 h-3 flex-shrink-0" />
            {business.name}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-lg">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">{coupon.code}</span>
          </div>
          {expires && (
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              {expires}
            </div>
          )}
        </div>

        {coupon.limit_count && (
          <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (coupon.used_count / coupon.limit_count) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </>
  );

  if (business) {
    return (
      <Link href={`/business/${business.id}`} className="card overflow-hidden group hover:shadow-lg transition-all block">
        {cardContent}
      </Link>
    );
  }

  return <div className="card overflow-hidden group hover:shadow-lg transition-all">{cardContent}</div>;
}

export const revalidate = 30;

export default async function CouponsPage() {
  const realCoupons = await getRealCoupons();
  const allCoupons: CouponWithBusiness[] = [...realCoupons, ...ALL_DEMO_COUPONS];

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-950 text-white px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm mb-4">
            <Ticket className="w-4 h-4 text-brand-300" />
            Cupones exclusivos
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Descuentos en tiendas locales</h1>
          <p className="text-brand-200 text-base max-w-xl mx-auto">
            Ahorra en tus compras favoritas con cupones de negocios de Acámbaro. Muestra el código en tienda o escanea el QR.
          </p>
        </div>
      </div>

      {/* Grid de cupones */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {allCoupons.length} cupones disponibles
          </h2>
          <Link href="/" className="text-sm text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
            Ver tiendas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allCoupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      </div>
    </div>
  );
}
