"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, MapPin, Save, LocateFixed, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setCurrentBusinessId } from "@/lib/current-business";
import CategoryPicker, { CategoryPick, picksToNames, namesToPicks } from "@/components/ui/CategoryPicker";
import { useCategories } from "@/lib/hooks/use-categories";
import ImageCropUpload from "@/components/ui/ImageCropUpload";
import toast from "react-hot-toast";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function CrearTiendaPage() {
  const { user } = useUser();
  const router = useRouter();

  const { tree: categoryTree, addCreated } = useCategories();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Se guarda el pick (ids), no el nombre ya resuelto — resolverlo en el
  // mismo onChange usaría el árbol de ANTES de crear la categoría (todavía
  // no se actualiza en ese mismo tick), dejando la selección sin aplicar.
  // Se resuelve a nombre hasta el envío, cuando el árbol ya está al día.
  const [pick, setPick] = useState<CategoryPick | null>(null);
  const effectivePick = pick ?? namesToPicks(["Otro"], categoryTree)[0] ?? null;
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [latitude, setLatitude] = useState<number | null>(20.0319);
  const [longitude, setLongitude] = useState<number | null>(-100.7273);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!user) return;
    const category = effectivePick ? picksToNames([effectivePick], categoryTree)[0] : undefined;
    if (!category) {
      toast.error("Elige una categoría para tu negocio");
      return;
    }
    setSaving(true);

    const supabase = createClient();
    const uploadTo = async (blob: Blob, prefix: string) => {
      const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("business-images").upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadErr) return undefined;
      const { data: { publicUrl } } = supabase.storage.from("business-images").getPublicUrl(path);
      return publicUrl;
    };

    const image_url = imageBlob ? await uploadTo(imageBlob, "logo") : undefined;
    const banner_url = bannerBlob ? await uploadTo(bannerBlob, "banner") : undefined;

    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category, address, latitude, longitude, whatsapp, image_url, banner_url }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Error al crear la tienda");
      setSaving(false);
      return;
    }

    setCurrentBusinessId(data.business.id);
    toast.success("Tienda creada. Pendiente de aprobación.");
    router.push("/dashboard/business");
  };

  if (IS_DEMO) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-3">
        <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-slate-500 dark:text-slate-400">Crear una tienda real requiere Supabase configurado. Prueba el modo &quot;Demo Tienda&quot; desde el login mientras tanto.</p>
        <Link href="/perfil" className="btn-primary inline-flex items-center gap-2 text-sm mt-2">Volver a mi cuenta</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <Link href="/perfil" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mi cuenta
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crear tienda</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Publica tu negocio en Acom-Di</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Información general</h2>

          <div>
            <label className="label">Nombre del negocio *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ej: Taquería El Charro" />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input resize-none" rows={3} placeholder="Cuéntales a los clientes qué ofreces..." />
          </div>

          <div>
            <label className="label">Categoría *</label>
            <CategoryPicker
              mode="single"
              tree={categoryTree}
              value={effectivePick}
              onChange={setPick}
              allowSubcategory={false}
              onCategoryCreated={addCreated}
            />
          </div>

          <div>
            <label className="label">Dirección *</label>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="Calle, colonia, Acámbaro, Gto." />
          </div>

          <div>
            <label className="label">WhatsApp (sin +52)</label>
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" placeholder="4181234567" />
          </div>

          <ImageCropUpload
            label="Foto de perfil (logo)"
            helperText="Se ve como el círculo pequeño en tu ficha pública."
            aspect={1}
            outputWidth={512}
            outputHeight={512}
            shape="round"
            onChange={setImageBlob}
          />

          <ImageCropUpload
            label="Foto de portada (banner)"
            helperText="La franja grande de arriba en tu ficha pública. Si no subes una, se usa tu logo estirado como respaldo."
            aspect={3}
            outputWidth={1200}
            outputHeight={400}
            shape="rect"
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
          {latitude != null && longitude != null && (
            <p className="text-xs text-green-600 dark:text-green-400 text-center">
              ✓ Ubicación guardada: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Creando..." : "Crear tienda"}
        </button>
      </form>
    </div>
  );
}
