"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Business, BusinessBranch, BUSINESS_CATEGORIES } from "@/types";
import { Settings, MapPin, Save, LocateFixed, CreditCard, CheckCircle2, Plus, Store, Truck, Trash2 } from "lucide-react";
import { loadOwnedBusinesses } from "@/lib/current-business";
import CategorySelect from "@/components/ui/CategorySelect";
import ImageCropUpload from "@/components/ui/ImageCropUpload";
import toast from "react-hot-toast";
import { DEMO_BUSINESS } from "@/lib/demo-data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

function SettingsContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Partial<Business>>(IS_DEMO ? DEMO_BUSINESS : {});
  const [loading, setLoading] = useState(!IS_DEMO);
  const [noBusiness, setNoBusiness] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [locating, setLocating] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [branches, setBranches] = useState<BusinessBranch[]>([]);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const supabase = createClient();

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusiness((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
        toast.success("Ubicación detectada");
      },
      () => {
        setLocating(false);
        toast.error("No se pudo obtener tu ubicación. Revisa los permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (IS_DEMO) return;
    if (!isLoaded || !user) return;
    const load = async () => {
      const { active } = await loadOwnedBusinesses(supabase, user.id);
      if (active) {
        setBusiness(active);
      } else {
        setNoBusiness(true);
      }
      setLoading(false);
    };
    load();
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (IS_DEMO || !business.id) return;
    supabase.from("business_branches").select("*").eq("business_id", business.id).order("created_at", { ascending: true }).then(({ data }) => {
      setBranches((data ?? []) as BusinessBranch[]);
    });
  }, [business.id]);

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("¿Eliminar esta sucursal?")) return;
    setDeletingBranchId(id);
    const res = await fetch(`/api/business-branches?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast.success("Sucursal eliminada");
    } else {
      toast.error("No se pudo eliminar la sucursal");
    }
    setDeletingBranchId(null);
  };

  useEffect(() => {
    const returnBusinessId = searchParams.get("business_id");
    if (!user || !searchParams.get("stripe_return") || !returnBusinessId) return;
    fetch(`/api/stripe/connect?business_id=${returnBusinessId}`).then((res) => res.json()).then((data) => {
      if (data.chargesEnabled) {
        toast.success("¡Stripe conectado! Ya puedes recibir pagos con tarjeta.");
        setBusiness((prev) => ({ ...prev, stripe_charges_enabled: true }));
      } else if (data.connected) {
        toast.error("Stripe aún no terminó de verificar tu cuenta. Completa el proceso para poder recibir pagos.");
      }
    });
  }, [user, searchParams]);

  const handleConnectStripe = async () => {
    if (IS_DEMO) { toast("Conecta Supabase para vincular Stripe real", { icon: "ℹ️" }); return; }
    if (!business.id) return;
    setConnectingStripe(true);
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      toast.error("No se pudo iniciar la conexión con Stripe.");
      setConnectingStripe(false);
      return;
    }
    window.location.href = data.url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (IS_DEMO) { toast("Conecta Supabase para guardar cambios reales", { icon: "ℹ️" }); return; }
    if (!user) return;

    const mpPublicKey = business.mp_public_key?.trim() || "";
    const mpAccessToken = business.mp_access_token?.trim() || "";
    if ((mpPublicKey && !mpAccessToken) || (!mpPublicKey && mpAccessToken)) {
      toast.error("Para usar Mercado Pago necesitas llenar Public Key y Access Token, los dos.");
      return;
    }

    if (!business.pickup_enabled && !business.meeting_enabled && !business.home_enabled) {
      toast.error("Activa al menos un método de entrega.");
      return;
    }

    setSaving(true);

    const uploadTo = async (blob: Blob, prefix: string) => {
      const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("business-images").upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadErr) return undefined;
      const { data: { publicUrl } } = supabase.storage.from("business-images").getPublicUrl(path);
      return publicUrl;
    };

    const image_url = imageBlob ? (await uploadTo(imageBlob, "logo")) ?? business.image_url : business.image_url;
    const banner_url = bannerBlob ? (await uploadTo(bannerBlob, "banner")) ?? business.banner_url : business.banner_url;

    const payload = {
      name: business.name!,
      description: business.description,
      category: business.category!,
      address: business.address!,
      latitude: business.latitude,
      longitude: business.longitude,
      whatsapp: business.whatsapp,
      image_url,
      banner_url,
      bank_name: business.bank_name || null,
      bank_holder: business.bank_holder || null,
      bank_clabe: business.bank_clabe || null,
      mp_public_key: business.mp_public_key || null,
      mp_access_token: business.mp_access_token || null,
      pickup_enabled: business.pickup_enabled ?? true,
      meeting_enabled: business.meeting_enabled ?? true,
      home_enabled: business.home_enabled ?? true,
    };

    const { error } = await supabase.from("businesses").update(payload).eq("id", business.id);
    if (!error) {
      toast.success("Cambios guardados");
    } else {
      toast.error("Error al guardar: " + error.message);
    }

    setSaving(false);
  };

  const update = (key: keyof Business, val: string | number) =>
    setBusiness((prev) => ({ ...prev, [key]: val }));

  const toggleDelivery = (key: "pickup_enabled" | "meeting_enabled" | "home_enabled") =>
    setBusiness((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map((i) => <div key={i} className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl" />)}</div>;

  if (noBusiness) {
    return (
      <div className="max-w-2xl text-center py-12 space-y-3">
        <Settings className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-slate-500 dark:text-slate-400">No encontramos ninguna tienda tuya todavía.</p>
        <Link href="/perfil/crear-tienda" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Crear tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración del negocio</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Actualiza la información de tu negocio</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {business.is_approved && (
            <Link href="/perfil/crear-sucursal" className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
              <Plus className="w-4 h-4" /> Agregar nueva sucursal
            </Link>
          )}
          <Link href="/perfil/crear-tienda" className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
            <Plus className="w-4 h-4" /> Agregar otra tienda
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Información general</h2>

          <div>
            <label className="label">Nombre del negocio *</label>
            <input required value={business.name ?? ""} onChange={(e) => update("name", e.target.value)} className="input" placeholder="Ej: Taquería El Charro" />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea value={business.description ?? ""} onChange={(e) => update("description", e.target.value)} className="input resize-none" rows={3} placeholder="Cuéntales a los clientes qué ofreces..." />
          </div>

          <div>
            <label className="label">Categoría *</label>
            <CategorySelect
              value={business.category ?? BUSINESS_CATEGORIES[0]}
              onChange={(c) => update("category", c)}
              options={BUSINESS_CATEGORIES}
            />
          </div>

          <div>
            <label className="label">Dirección *</label>
            <input required value={business.address ?? ""} onChange={(e) => update("address", e.target.value)} className="input" placeholder="Calle, colonia, Acámbaro, Gto." />
          </div>

          <div>
            <label className="label">WhatsApp (sin +52)</label>
            <input type="tel" value={business.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} className="input" placeholder="4181234567" />
          </div>

          <ImageCropUpload
            label="Foto de perfil (logo)"
            helperText="Se ve como el círculo pequeño en tu ficha pública."
            aspect={1}
            outputWidth={512}
            outputHeight={512}
            shape="round"
            currentUrl={business.image_url}
            onChange={setImageBlob}
          />

          <ImageCropUpload
            label="Foto de portada (banner)"
            helperText="La franja grande de arriba en tu ficha pública. Si no subes una, se usa tu logo estirado como respaldo."
            aspect={3}
            outputWidth={1200}
            outputHeight={400}
            shape="rect"
            currentUrl={business.banner_url}
            onChange={setBannerBlob}
          />
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            Ubicación en el mapa
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para que tu negocio aparezca en el mapa, usa tu ubicación actual (párate en tu negocio y da clic).
          </p>
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locating}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {locating ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Detectando ubicación...</>
            ) : (
              <><LocateFixed className="w-4 h-4" /> Usar mi ubicación actual</>
            )}
          </button>
          {business.latitude != null && business.longitude != null && (
            <p className="text-xs text-green-600 dark:text-green-400 text-center">
              ✓ Ubicación guardada: {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)}
            </p>
          )}
          <details className="text-xs text-slate-400 dark:text-slate-500">
            <summary className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">¿Prefieres poner las coordenadas a mano?</summary>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="label">Latitud</label>
                <input type="number" step="any" value={business.latitude ?? ""} onChange={(e) => update("latitude", parseFloat(e.target.value))} className="input" placeholder="20.0319" />
              </div>
              <div>
                <label className="label">Longitud</label>
                <input type="number" step="any" value={business.longitude ?? ""} onChange={(e) => update("longitude", parseFloat(e.target.value))} className="input" placeholder="-100.7273" />
              </div>
            </div>
          </details>
        </div>

        {business.is_approved && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-600" />
                Sucursales
              </h2>
              <Link href="/perfil/crear-sucursal" className="btn-secondary flex items-center gap-2 text-xs flex-shrink-0">
                <Plus className="w-3.5 h-3.5" /> Agregar sucursal
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Otras ubicaciones de esta misma tienda. Comparten tus productos y cupones, solo cambia la dirección.
            </p>
            {branches.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Todavía no tienes sucursales.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{b.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{b.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(b.id)}
                      disabled={deletingBranchId === b.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                      title="Eliminar sucursal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-600" />
            Configuración de entregas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Elige cómo entregas tus pedidos. Al cliente solo se le mostrarán los métodos que actives aquí.
          </p>

          {([
            { key: "pickup_enabled", icon: Store, label: "Recoger en tienda", sub: "El cliente pasa por su pedido a tu negocio" },
            { key: "meeting_enabled", icon: MapPin, label: "Punto de reunión", sub: "Acuerdan un lugar público para la entrega" },
            { key: "home_enabled", icon: Truck, label: "Entrega a domicilio", sub: "Llevas el pedido a la dirección del cliente" },
          ] as const).map(({ key, icon: Icon, label, sub }) => {
            const enabled = business[key] ?? true;
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => toggleDelivery(key)}
                  className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
                    enabled ? "bg-brand-500" : "bg-slate-300 dark:bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Datos bancarios (opcional)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Si los llenas, tus clientes podrán pagarte por transferencia directo en el checkout, con tu cuenta real.
          </p>
          <div>
            <label className="label">Banco</label>
            <input value={business.bank_name ?? ""} onChange={(e) => update("bank_name", e.target.value)} className="input" placeholder="Ej: BBVA" />
          </div>
          <div>
            <label className="label">Titular de la cuenta</label>
            <input value={business.bank_holder ?? ""} onChange={(e) => update("bank_holder", e.target.value)} className="input" placeholder="Nombre del titular" />
          </div>
          <div>
            <label className="label">CLABE interbancaria</label>
            <input value={business.bank_clabe ?? ""} onChange={(e) => update("bank_clabe", e.target.value)} className="input" placeholder="18 dígitos" maxLength={18} />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Mercado Pago (opcional)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Si las llenas, tus clientes podrán pagarte con tarjeta, OXXO o SPEI directo en el checkout, y el dinero cae en tu propia cuenta de Mercado Pago, no en la de AcambaGo. Consigue tus llaves en{" "}
            <a href="https://www.mercadopago.com.mx/developers/es/docs/your-integrations/credentials" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline">
              mercadopago.com.mx → Tus integraciones → Credenciales
            </a>.
          </p>
          <div>
            <label className="label">Public Key</label>
            <input value={business.mp_public_key ?? ""} onChange={(e) => update("mp_public_key", e.target.value)} className="input" placeholder="APP_USR-..." />
          </div>
          <div>
            <label className="label">Access Token</label>
            <input type="password" value={business.mp_access_token ?? ""} onChange={(e) => update("mp_access_token", e.target.value)} className="input" placeholder="APP_USR-..." />
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Usa tus llaves de <strong>producción</strong> (empiezan con <code>APP_USR-</code>). Las de prueba (<code>TEST-...</code>) no van a cobrar dinero real y AcambaGo no puede detectar la diferencia automáticamente.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600" />
            Stripe (opcional)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conecta tu propia cuenta de Stripe para recibir pagos con tarjeta directo en el checkout. El dinero cae en tu cuenta, no en la de AcambaGo. Stripe te pedirá datos de identidad y de tu cuenta bancaria (proceso de Stripe, no de AcambaGo).
          </p>
          {business.stripe_charges_enabled ? (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-300">Stripe conectado y listo para recibir pagos.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              {connectingStripe ? "Conectando..." : business.stripe_account_id ? "Continuar verificación de Stripe" : "Conectar con Stripe"}
            </button>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
