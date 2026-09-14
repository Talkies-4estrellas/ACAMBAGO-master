"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { generateCouponCode } from "@/lib/utils";
import { Business, QRPayload } from "@/types";
import { ArrowLeft, Ticket, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { loadOwnedBusinesses } from "@/lib/current-business";
import CouponForm, { CouponFormValues } from "../CouponForm";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function NewCouponPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = createClient();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(!IS_DEMO);

  useEffect(() => {
    if (IS_DEMO) return;
    if (!isLoaded || !user) return;
    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      setBusiness(biz);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const handleSubmit = async (values: CouponFormValues) => {
    if (!isLoaded || !user) { toast.error("No autorizado"); return; }

    const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
    if (!biz) { toast.error("No tienes un negocio registrado"); return; }

    const code = generateCouponCode();
    const payload: QRPayload = { coupon_code: code, business_id: biz.id };
    const qr_data = JSON.stringify(payload);

    const { error } = await supabase.from("coupons").insert({
      business_id: biz.id,
      title: values.title,
      description: values.description,
      discount_type: values.discountType,
      value: parseFloat(values.value),
      code,
      qr_data,
      limit_count: values.limitCount ? parseInt(values.limitCount) : null,
      expires_at: values.expiresAt || null,
      is_active: true,
    });

    if (error) {
      // El trigger de la base de datos (consume_coupon_credit) bloquea el
      // insert con un mensaje ya listo para mostrar si no hay saldo — esto
      // es un respaldo por si el saldo cambió entre que se cargó la página
      // y que se envió el formulario (ej. dos pestañas abiertas a la vez).
      toast.error(error.message.includes("cupones disponibles") ? error.message : "Error al crear el cupón");
      return;
    }

    toast.success("Cupón creado con QR generado");
    router.push("/dashboard/business/coupons");
  };

  const credits = business?.coupon_credits ?? 0;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crear cupón</h1>
          {!loading && (
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {credits > 0 ? `Se generará un código QR automáticamente · ${credits} disponibles` : "Se generará un código QR automáticamente"}
            </p>
          )}
        </div>
      </div>

      {IS_DEMO ? (
        <div className="card p-6 flex items-start gap-3 border-l-4 border-l-slate-300 bg-slate-50/50 dark:bg-white/5">
          <AlertTriangle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Conecta Supabase para crear cupones reales. En modo demo esta pantalla es solo de vista.
          </p>
        </div>
      ) : loading ? (
        <div className="card h-64 animate-pulse bg-gray-100 dark:bg-white/5" />
      ) : credits <= 0 ? (
        <div className="card p-6 flex items-start gap-3 border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-500/5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">No tienes cupones disponibles</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Se te acabó el saldo de cupones que puedes crear. Pide al administrador de Acom-Di que te asigne más para poder crear uno nuevo.
            </p>
          </div>
        </div>
      ) : (
        <CouponForm submitLabel="Crear cupón con QR" savingLabel="Creando..." onSubmit={handleSubmit} />
      )}
    </div>
  );
}
