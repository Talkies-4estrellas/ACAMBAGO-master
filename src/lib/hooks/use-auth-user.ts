"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDemoMode, DEMO_BUYER, DEMO_SELLER } from "@/lib/demo-mode";

interface AuthUser {
  userId: string | null;
  name: string | null;
  role: string | null;
  // Tiene al menos una tienda propia, aprobada o no. El rol solo sube a
  // "business" cuando un admin aprueba la primera tienda (ver
  // /api/admin/businesses) — mientras está pendiente, el rol se queda en
  // "client" pero esto ya es true, para que "Mi tienda" siga siendo
  // alcanzable sin mostrar al usuario como vendedor todavía.
  hasBusiness: boolean;
  loading: boolean;
}

export function useAuthUser(): AuthUser {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [demoMode, setDemoMode] = useState<"buyer" | "seller" | null>(null);

  // Lee la cookie de demo, pero solo si no hay una sesion real de Clerk
  // activa — una sesion real siempre gana sobre la cookie de demo.
  useEffect(() => {
    if (!isLoaded) return;
    const mode = user ? null : getDemoMode();
    setDemoMode(mode);
    if (mode) setProfileLoaded(true);
  }, [isLoaded, user]);

  useEffect(() => {
    if (demoMode) return;
    if (!isLoaded) return;
    if (!user) {
      setName(null);
      setRole(null);
      setHasBusiness(false);
      setProfileLoaded(true);
      return;
    }
    const supabase = createClient();
    const load = async () => {
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("name, role").eq("id", user.id).single(),
        supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
      ]);
      if (profile) {
        setName(profile.name);
        setRole(profile.role);
      } else {
        setName(user.fullName ?? user.firstName ?? user.emailAddresses[0]?.emailAddress ?? null);
        setRole("client");
      }
      setHasBusiness((count ?? 0) > 0);
      setProfileLoaded(true);
    };
    load();
    // Se vuelve a leer en cada cambio de ruta (no solo cuando cambia el
    // usuario), para que un rol recien actualizado (ej. crear tienda sube
    // de "client" a "business") se refleje sin necesitar recargar la pagina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, demoMode, pathname]);

  if (demoMode === "buyer") {
    return { userId: DEMO_BUYER.userId, name: DEMO_BUYER.name, role: "client", hasBusiness: false, loading: false };
  }
  if (demoMode === "seller") {
    return { userId: DEMO_SELLER.userId, name: DEMO_SELLER.businessName, role: "business", hasBusiness: true, loading: false };
  }

  return { userId: user?.id ?? null, name, role, hasBusiness, loading: !isLoaded || !profileLoaded };
}
