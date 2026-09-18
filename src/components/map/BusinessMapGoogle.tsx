"use client";

import { useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { Business } from "@/types";

const ACAMBARO_CENTER = { lat: 20.0319, lng: -100.7273 };
const MAP_ID = "acomdi-map"; // puede ser cualquier string o un Map ID real de Google

// Un pin puede ser el negocio mismo, o una sucursal suya: en ese caso `id` es
// el id propio de la sucursal (para poder enfocarla sin ambigüedad) y
// `businessId` es el negocio al que debe llevar el link "Ver negocio →".
type MapPin = Business & { businessId?: string };

interface Props {
  businesses: MapPin[];
  apiKey: string;
  /** ID de negocio a centrar/resaltar (viene de "Ver en el mapa" de una tarjeta). */
  focusId?: string;
}

export default function BusinessMapGoogle({ businesses, apiKey, focusId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);

  const withCoords = businesses.filter((b) => b.latitude && b.longitude);
  const selected = withCoords.find((b) => b.id === selectedId) ?? null;
  const focusBusiness = focusId ? withCoords.find((b) => b.id === focusId) : undefined;
  const initialCenter = focusBusiness
    ? { lat: focusBusiness.latitude!, lng: focusBusiness.longitude! }
    : ACAMBARO_CENTER;

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId={MAP_ID}
        defaultCenter={initialCenter}
        defaultZoom={focusBusiness ? 17 : 14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      >
        {withCoords.map((business) => (
          <AdvancedMarker
            key={business.id}
            position={{ lat: business.latitude!, lng: business.longitude! }}
            onClick={() => handleMarkerClick(business.id)}
          >
            <Pin
              background="#068562"
              borderColor="#013F4A"
              glyphColor="white"
              scale={selectedId === business.id ? 1.3 : 1}
            />
          </AdvancedMarker>
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.latitude!, lng: selected.longitude! }}
            onCloseClick={() => setSelectedId(null)}
            pixelOffset={[0, -42]}
          >
            <div className="min-w-[200px] p-1 font-sans">
              <p className="font-bold text-gray-900 text-sm leading-snug">{selected.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{selected.category}</p>
              <p className="text-xs text-amber-500 mt-0.5">
                ⭐ {Number(selected.rating_avg).toFixed(1)} ({selected.rating_count} reseñas)
              </p>
              {selected.address && (
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{selected.address}</p>
              )}
              <Link
                href={`/business/${selected.businessId ?? selected.id}`}
                className="inline-block mt-2.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg transition-colors no-underline"
                style={{ background: "#068562", color: "white" }}
              >
                Ver negocio →
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
