import { Business } from "@/types";
import { DEMO_BUSINESSES, DEMO_BUSINESSES_EXTRA } from "@/lib/demo-data";
import MapWrapper from "@/components/map/MapWrapper";
import { MapPin } from "lucide-react";

export const revalidate = 60;

async function getBusinesses(): Promise<Business[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || url.includes("placeholder") || url.includes("your-project")) return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("is_approved", true)
      .eq("is_active", true)
      .not("latitude", "is", null);
    return (data ?? []) as Business[];
  } catch {
    return [];
  }
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const { business: focusId } = await searchParams;
  const supabaseBusinesses = await getBusinesses();
  const businesses: Business[] = [
    ...[...DEMO_BUSINESSES, ...DEMO_BUSINESSES_EXTRA].filter((b) => b.latitude && b.longitude),
    ...supabaseBusinesses.filter((b) => !b.id.startsWith("demo")),
  ];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="px-4 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#040a14] shrink-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-500" />
          Mapa de Negocios — Acámbaro
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {businesses.length} negocios en el mapa · Toca un marcador para ver el negocio
        </p>
      </div>
      <div className="flex-1 min-h-0 p-3">
        <MapWrapper businesses={businesses} focusId={focusId} />
      </div>
    </div>
  );
}
