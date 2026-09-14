// Cookie que recuerda cuál de las tiendas del vendedor está gestionando
// (un mismo dueño puede tener varias). Mismo patrón que la cookie demo_mode
// en lib/demo-mode.ts.

import type { Business } from "@/types";
import type { createClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

const COOKIE_NAME = "current_business_id";

export function getCurrentBusinessId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export function setCurrentBusinessId(businessId: string): void {
  document.cookie = `${COOKIE_NAME}=${businessId}; path=/; max-age=31536000; SameSite=Lax`;
}

// Trae todas las tiendas del dueño y resuelve cuál es la "activa" según la
// cookie (si no hay cookie, o ya no le pertenece, usa la más antigua y
// actualiza la cookie). Se usa en todas las páginas del panel de vendedor
// para dejar de asumir una sola tienda por dueño.
export async function loadOwnedBusinesses(supabase: SupabaseBrowserClient, ownerId: string) {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  const businesses = (data ?? []) as Business[];
  if (businesses.length === 0) return { businesses, active: null as Business | null };

  const stored = getCurrentBusinessId();
  const active = businesses.find((b) => b.id === stored) ?? businesses[0];
  if (active.id !== stored) setCurrentBusinessId(active.id);

  return { businesses, active };
}
