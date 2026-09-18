"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, MapPin, Save, LocateFixed, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadOwnedBusinesses } from "@/lib/current-business";
import { Business } from "@/types";
import toast from "react-hot-toast";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function CrearSucursalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [latitude, setLatitude] = useState<number | null>(20.0319);
  const [longitude, setLongitude] = useState<number | null>(-100.7273);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (IS_DEMO) return;
    if (!isLoaded || !user) return;
    const supabase = createClient();
    loadOwnedBusinesses(supabase, user.id).then(({ active }) => {
      setBusiness(active);
      setLoading(false);
    });
  }, [isLoaded, user?.id]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaving(true);

    const res = await fetch("/api/business-branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id, name, address, latitude, longitude, whatsapp }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Error al crear la sucursal");
      setSaving(false);
      return;
    }

    toast.success("Sucursal creada");
    router.push("/dashboard/business/settings");
  };

  if (IS_DEMO) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-3">
        <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-slate-500 dark:text-slate-400">Agregar una sucursal real requiere Supabase configurado.</p>
        <Link href="/perfil" className="btn-primary inline-flex items-center gap-2 text-sm mt-2">Volver a mi cuenta</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl" />)}</div>;
  }

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-3">
        <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-slate-500 dark:text-slate-400">No encontramos ninguna tienda tuya todavía. Crea una tienda antes de agregar una sucursal.</p>
        <Link href="/perfil/crear-tienda" className="btn-primary inline-flex items-center gap-2 text-sm mt-2">Crear tienda</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <Link href="/dashboard/business/settings" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Configuración
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agregar sucursal</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Otra ubicación de {business.name}. Comparte productos y cupones con tu tienda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Información de la sucursal</h2>

          <div>
            <label className="label">Nombre de la sucursal *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ej: Sucursal Centro" />
          </div>

          <div>
            <label className="label">Dirección *</label>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="Calle, colonia, Acámbaro, Gto." />
          </div>

          <div>
            <label className="label">WhatsApp de esta sucursal (opcional, sin +52)</label>
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" placeholder={business.whatsapp || "4181234567"} />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Si lo dejas vacío, se usa el WhatsApp de tu tienda.</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            Ubicación en el mapa
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Párate en la sucursal y da clic para que aparezca en el mapa en el lugar correcto.
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
          {latitude != null && longitude != null && (
            <p className="text-xs text-green-600 dark:text-green-400 text-center">
              ✓ Ubicación guardada: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Creando..." : "Crear sucursal"}
        </button>
      </form>
    </div>
  );
}
