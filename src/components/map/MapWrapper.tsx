"use client";

import dynamic from "next/dynamic";
import { Business } from "@/types";

// Google Maps (requiere NEXT_PUBLIC_GOOGLE_MAPS_KEY)
const BusinessMapGoogle = dynamic(() => import("./BusinessMapGoogle"), { ssr: false });

// Fallback: OpenStreetMap/Leaflet (sin key, siempre disponible)
const BusinessMapLeaflet = dynamic(() => import("./BusinessMap"), { ssr: false });

interface Props {
  businesses: Business[];
  /** ID de negocio a centrar/resaltar (viene de "Ver en el mapa" de una tarjeta). */
  focusId?: string;
}

export default function MapWrapper({ businesses, focusId }: Props) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const useGoogle = !!googleKey && googleKey.startsWith("AIza");

  return (
    <div className="h-full w-full">
      {useGoogle ? (
        <BusinessMapGoogle businesses={businesses} apiKey={googleKey} focusId={focusId} />
      ) : (
        <BusinessMapLeaflet businesses={businesses} focusId={focusId} />
      )}
    </div>
  );
}
