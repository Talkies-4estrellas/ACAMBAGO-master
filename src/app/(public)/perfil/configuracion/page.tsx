"use client";

import { useEffect, useState } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Save, Camera, Settings, Store, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { getDemoMode, DEMO_BUYER } from "@/lib/demo-mode";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function ConfiguracionPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const createPhoneNumberWithReverification = useReverification((phoneNumber: string) => user!.createPhoneNumber({ phoneNumber }));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalPhone, setOriginalPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [pendingPhoneResource, setPendingPhoneResource] = useState<Awaited<ReturnType<NonNullable<typeof user>["createPhoneNumber"]>> | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const demoMode = getDemoMode();
    if (demoMode === "buyer") {
      setName(DEMO_BUYER.name);
      setPhone(DEMO_BUYER.phone);
      setLoading(false);
      return;
    }

    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    if (IS_DEMO) {
      setName(user.fullName ?? user.firstName ?? "Comprador");
      setLoading(false);
      return;
    }

    supabase.from("profiles").select("name, phone, avatar_url").eq("id", user.id).single().then(({ data: profile }) => {
      if (profile) {
        setName(profile.name ?? "");
        setPhone(profile.phone ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
        setOriginalPhone(profile.phone ?? "");
      } else {
        setName(user.fullName ?? user.firstName ?? "");
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const demoMode = getDemoMode();
    if (!file || !user || demoMode || IS_DEMO) return;

    setUploadingAvatar(true);
    try {
      const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      let uploadBlob: Blob = file;
      let ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      let contentType = file.type || "image/jpeg";

      if (isHeic) {
        const convert = (await import("heic-convert/browser")).default;
        const buffer = await file.arrayBuffer();
        const output = await convert({ buffer: new Uint8Array(buffer), format: "JPEG", quality: 0.9 });
        uploadBlob = new Blob([output as BlobPart], { type: "image/jpeg" });
        ext = "jpg";
        contentType = "image/jpeg";
      }

      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("profile-images").upload(path, uploadBlob, { upsert: true, contentType });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: { publicUrl } } = supabase.storage.from("profile-images").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("profiles").upsert({ id: user.id, name, phone, avatar_url: publicUrl });
      if (dbErr) throw new Error(dbErr.message);

      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la foto");
    }
    setUploadingAvatar(false);
  };

  const savePhoneToProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, name, phone });
    if (!error) {
      toast.success("Perfil actualizado");
      setOriginalPhone(phone);
    } else {
      toast.error("Error al guardar");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const demoMode = getDemoMode();
    if (demoMode || IS_DEMO) { toast.success("Perfil actualizado (modo demo)"); return; }
    if (!user) return;

    const digits = phone.replace(/\D/g, "");
    const phoneChanged = digits.length > 0 && digits !== originalPhone.replace(/\D/g, "");

    if (!phoneChanged) {
      setSaving(true);
      await savePhoneToProfile();
      setSaving(false);
      return;
    }

    setSaving(true);
    try {
      const phoneResource = await createPhoneNumberWithReverification(`+52${digits}`);
      if (!phoneResource) return;
      await phoneResource.prepareVerification();
      setPendingPhoneResource(phoneResource);
      setVerifyingPhone(true);
      toast.success("Te enviamos un código por SMS a tu teléfono");
    } catch (err) {
      if (isReverificationCancelledError(err)) {
        toast("Cancelaste la verificación", { icon: "ℹ️" });
      } else {
        const message = err instanceof Error ? err.message : "No se pudo enviar el código de verificación";
        toast.error(message);
      }
    }
    setSaving(false);
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPhoneResource) return;
    setConfirmingCode(true);
    try {
      await pendingPhoneResource.attemptVerification({ code: otpCode });
      await savePhoneToProfile();
      setVerifyingPhone(false);
      setPendingPhoneResource(null);
      setOtpCode("");
    } catch {
      toast.error("Código incorrecto, intenta de nuevo");
    }
    setConfirmingCode(false);
  };

  const cancelPhoneVerification = () => {
    pendingPhoneResource?.destroy().catch(() => {});
    setVerifyingPhone(false);
    setPendingPhoneResource(null);
    setOtpCode("");
    setPhone(originalPhone);
  };

  if (loading || (!getDemoMode() && !isLoaded)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const demoMode = getDemoMode();
  const email = demoMode === "buyer" ? DEMO_BUYER.email : (user?.emailAddresses[0]?.emailAddress ?? "");
  const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-500" /> Configuración
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tu foto, nombre y teléfono de contacto</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name || "Mi foto"} fill className="object-cover" />
              ) : (
                initials
              )}
            </div>
            {!demoMode && !IS_DEMO && (
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                {uploadingAvatar ? (
                  <span className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                )}
                <input type="file" accept="image/*,.heic,.heif" onChange={handleAvatarChange} disabled={uploadingAvatar} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{name || "Mi cuenta"}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-100 dark:border-brand-500/20">
              <User className="w-3 h-3" /> Comprador
            </span>
          </div>
        </div>

        {verifyingPhone ? (
          <form onSubmit={handleConfirmCode} className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Te enviamos un código por SMS al <span className="font-semibold">{phone}</span>. Ingrésalo para confirmar tu número.
            </p>
            <div>
              <label className="label">Código de verificación</label>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="input tracking-widest text-center"
                placeholder="123456"
                inputMode="numeric"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={confirmingCode || !otpCode} className="btn-primary flex items-center gap-2 flex-1">
                <Save className="w-4 h-4" />
                {confirmingCode ? "Verificando..." : "Confirmar código"}
              </button>
              <button type="button" onClick={cancelPhoneVerification} className="px-4 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSave} className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="4181234567" />
                {!IS_DEMO && !getDemoMode() && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Si lo cambias, te vamos a mandar un código por SMS para confirmarlo.</p>
                )}
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 w-full sm:w-auto">
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}
      </div>

      <div className="card divide-y divide-slate-100 dark:divide-white/10 overflow-hidden">
        <Link
          href="/perfil/crear-tienda"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <Store className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Crear tienda</span>
            <p className="text-xs text-slate-400 dark:text-slate-500">Publica tu negocio y empieza a vender en Acom-Di</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}
