"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Store, User, ChevronDown, Plus } from "lucide-react";
import { getDemoMode, DEMO_BUYER, DEMO_SELLER } from "@/lib/demo-mode";
import { loadOwnedBusinesses, setCurrentBusinessId } from "@/lib/current-business";
import { Business } from "@/types";
import ShareButton from "@/components/ui/ShareButton";
import AccountModeSwitcher from "@/components/ui/AccountModeSwitcher";

export default function UserInfo({ variant = "sidebar" }: { variant?: "sidebar" | "topbar" }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<"buyer" | "seller" | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<{ id?: string; name: string; is_approved?: boolean; image_url?: string } | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si ya hay una sesion real de Clerk, ignora la cookie de demo por
    // completo — no debe tapar la identidad real del usuario logueado.
    if (!isLoaded) return;
    const mode = user ? null : getDemoMode();
    setDemoMode(mode);
    if (mode === "buyer") {
      setName(DEMO_BUYER.name);
      setRole("client");
    } else if (mode === "seller") {
      setName(DEMO_SELLER.name);
      setActiveBusiness({ name: DEMO_SELLER.businessName });
      setRole("business");
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (demoMode || !isLoaded || !user) return;

    const supabase = createClient();
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

      const profileName = profile?.name ?? user.fullName ?? user.firstName ?? null;
      const profileRole = profile?.role ?? "client";
      setName(profileName);
      setRole(profileRole);

      // Se cargan las tiendas propias sin importar el rol: una tienda
      // pendiente de aprobación no sube el rol a "business" todavía, pero
      // "Mi tienda" debe seguir alcanzable mientras se revisa la solicitud.
      const { businesses: owned, active } = await loadOwnedBusinesses(supabase, user.id);
      setBusinesses(owned);
      setActiveBusiness(active);
    };
    load();
    // Se vuelve a leer en cada cambio de ruta, para que un rol recien
    // actualizado (ej. crear tienda sube de "client" a "business") se
    // refleje sin necesitar recargar la pagina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, demoMode, pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const switchTo = (id: string) => {
    setCurrentBusinessId(id);
    window.location.reload();
  };

  if (!name) return null;

  const hasMultiple = businesses.length > 1;
  const isTopbar = variant === "topbar";
  // En la barra superior movil no hay espacio para mostrar "Mi cuenta"/
  // "Compartir mi tienda" siempre en linea (eso era lo que desbordaba el
  // header ~250px mas alla del viewport). Ahi se mueven a un menu que solo
  // aparece al tocar, igual que ya pasaba con el selector de tiendas.
  const canOpen = isTopbar || hasMultiple;

  // "Ver mi tienda"/"Compartir mi tienda" solo tienen sentido una vez
  // aprobada (la ficha pública da 404 mientras está pendiente), así que se
  // quedan atados al rol real. El switcher Mi cuenta/Mi tienda, en cambio,
  // también debe verse con una tienda pendiente (rol todavía "client").
  const canPreviewStore = role === "business" && !!activeBusiness?.id;
  // Se excluye admin: un admin que también sea dueño de una tienda no debe
  // verse ni actuar como vendedor por eso.
  const actingAsSeller = role !== "admin" && (role === "business" || businesses.length > 0);

  return (
    <div
      ref={containerRef}
      className={`relative px-3 py-3 min-w-0 ${variant === "sidebar" ? "border-b border-slate-200 dark:border-white/10" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {canPreviewStore ? (
          <Link
            href={`/business/${activeBusiness!.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver mi tienda como la ven los clientes"
            className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0 hover:bg-brand-200 dark:hover:bg-brand-500/30 transition-colors overflow-hidden relative"
          >
            {activeBusiness?.image_url ? (
              <Image src={activeBusiness.image_url} alt={activeBusiness.name} fill className="object-cover" />
            ) : (
              <Store className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            )}
          </Link>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {actingAsSeller && activeBusiness?.image_url ? (
              <Image src={activeBusiness.image_url} alt={activeBusiness.name} fill className="object-cover" />
            ) : actingAsSeller ? (
              <Store className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            ) : (
              <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => canOpen && setOpen((o) => !o)}
          className={`min-w-0 flex-1 flex items-center gap-1.5 ${canOpen ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {activeBusiness?.name ?? name}
            </p>
            {activeBusiness && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{name}</p>
            )}
          </div>
          {canOpen && (
            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </button>
      </div>

      {!isTopbar && actingAsSeller && (
        <div className="mt-2">
          <AccountModeSwitcher compact />
        </div>
      )}

      {!isTopbar && canPreviewStore && (
        <ShareButton
          businessName={activeBusiness!.name}
          url={typeof window !== "undefined" ? `${window.location.origin}/business/${activeBusiness!.id}` : undefined}
          label="Compartir mi tienda"
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        />
      )}

      {open && canOpen && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden">
          {isTopbar && actingAsSeller && (
            <div className="p-2 space-y-1.5 border-b border-slate-100 dark:border-white/10">
              <AccountModeSwitcher compact />
              {canPreviewStore && (
                <ShareButton
                  businessName={activeBusiness!.name}
                  url={typeof window !== "undefined" ? `${window.location.origin}/business/${activeBusiness!.id}` : undefined}
                  label="Compartir mi tienda"
                  className="w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                />
              )}
            </div>
          )}
          {hasMultiple && businesses.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => switchTo(b.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                b.id === activeBusiness?.id ? "font-semibold text-brand-600 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"
              }`}
            >
              <Store className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{b.name}</span>
            </button>
          ))}
          <Link
            href="/perfil/crear-tienda"
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
              hasMultiple ? "border-t border-slate-100 dark:border-white/10" : ""
            }`}
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            Agregar otra tienda
          </Link>
          {/* Una sucursal solo tiene sentido para una tienda ya aprobada
              (comparte productos/cupones con ella) — antes de eso no hay
              nada que compartir todavía. */}
          {activeBusiness?.id && activeBusiness?.is_approved && (
            <Link
              href="/perfil/crear-sucursal"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              Agregar nueva sucursal
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
