"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Coupon } from "@/types";
import { ArrowLeft, Ticket } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { loadOwnedBusinesses } from "@/lib/current-business";
import CouponForm, { CouponFormValues } from "../../CouponForm";
import { DEMO_COUPONS } from "@/lib/demo-data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function EditCouponPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = createClient();

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (IS_DEMO) {
      const demo = DEMO_COUPONS.find((c) => c.id === params.id);
      if (!demo) { setNotFound(true); setLoading(false); return; }
      setCoupon(demo);
      setLoading(false);
      return;
    }
    if (!isLoaded || !user) return;
    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) { setNotFound(true); setLoading(false); return; }

      const { data } = await supabase.from("coupons").select("*").eq("id", params.id).maybeSingle();
      if (!data || data.business_id !== biz.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCoupon(data as Coupon);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, params.id]);

  const handleSubmit = async (values: CouponFormValues) => {
    if (!coupon) return;
    if (IS_DEMO) { toast("Conecta Supabase para editar cupones reales", { icon: "ℹ️" }); return; }

    const { error } = await supabase
      .from("coupons")
      .update({
        title: values.title,
        description: values.description,
        discount_type: values.discountType,
        value: parseFloat(values.value),
        limit_count: values.limitCount ? parseInt(values.limitCount) : null,
        expires_at: values.expiresAt || null,
      })
      .eq("id", coupon.id);

    if (error) {
      toast.error("Error al guardar los cambios");
      return;
    }

    toast.success("Cupón actualizado");
    router.push("/dashboard/business/coupons");
  };

  if (loading) {
    return <div className="card h-64 animate-pulse bg-gray-100 dark:bg-white/5 max-w-2xl" />;
  }

  if (notFound || !coupon) {
    return (
      <div className="max-w-2xl">
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-slate-400">No se encontró este cupón.</p>
          <Link href="/dashboard/business/coupons" className="text-brand-600 dark:text-brand-400 text-sm hover:underline mt-2 inline-block">
            Volver a cupones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/business/coupons" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a cupones
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
          <Ticket className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar cupón</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">El código QR y el código {coupon.code} no cambian</p>
        </div>
      </div>

      <CouponForm
        initialValues={{
          title: coupon.title,
          description: coupon.description ?? "",
          discountType: coupon.discount_type,
          value: String(coupon.value),
          limitCount: coupon.limit_count != null ? String(coupon.limit_count) : "",
          expiresAt: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
        }}
        submitLabel="Guardar cambios"
        savingLabel="Guardando..."
        onSubmit={handleSubmit}
        existingCode={coupon.code}
        existingQrData={coupon.qr_data}
      />
    </div>
  );
}
