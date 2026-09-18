"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Business } from "@/types";
import "leaflet/dist/leaflet.css";

const ACAMBARO_CENTER: [number, number] = [20.0319, -100.7273];

// Un pin puede ser el negocio mismo, o una sucursal suya: en ese caso `id` es
// el id propio de la sucursal (para poder enfocarla sin ambigüedad) y
// `businessId` es el negocio al que debe llevar el link "Ver negocio →".
type MapPin = Business & { businessId?: string };

interface Props {
  businesses: MapPin[];
  center?: [number, number];
  zoom?: number;
  /** ID de negocio a centrar y resaltar (viene de "Ver en el mapa" de una tarjeta). */
  focusId?: string;
}

export default function BusinessMap({ businesses, center = ACAMBARO_CENTER, zoom = 14, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const focusBusiness = focusId ? businesses.find((b) => b.id === focusId) : undefined;
    const hasFocusCoords = focusBusiness?.latitude != null && focusBusiness?.longitude != null;
    const initialCenter: [number, number] = hasFocusCoords
      ? [focusBusiness!.latitude!, focusBusiness!.longitude!]
      : center;
    const initialZoom = hasFocusCoords ? 17 : zoom;

    // Leaflet init directo en el effect — funciona correctamente con React Strict Mode
    // porque el cleanup llama map.remove() que limpia _leaflet_id antes del re-mount
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Ícono de marca
    const brandIcon = L.divIcon({
      html: `<div style="width:26px;height:26px;background:#068562;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -28],
      className: "",
    });

    // Ícono resaltado para el negocio al que se llegó desde "Ver en el mapa".
    const focusIcon = L.divIcon({
      html: `<div style="width:34px;height:34px;background:#f59e0b;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.45)"></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -36],
      className: "",
    });

    // Marcadores
    let focusMarker: L.Marker | undefined;
    businesses
      .filter((b) => b.latitude && b.longitude)
      .forEach((b) => {
        const isFocused = b.id === focusId;
        const marker = L.marker([b.latitude!, b.longitude!], { icon: isFocused ? focusIcon : brandIcon })
          .bindPopup(
            `<div style="min-width:180px;padding:4px 2px">
              <b style="font-size:13px;color:#0f172a;line-height:1.3">${b.name}</b>
              <p style="font-size:11px;color:#64748b;margin:2px 0 0">${b.category}</p>
              <p style="font-size:11px;color:#f59e0b;margin:2px 0 0">⭐ ${Number(b.rating_avg).toFixed(1)} (${b.rating_count} reseñas)</p>
              <p style="font-size:11px;color:#94a3b8;margin:2px 0 0">${b.address}</p>
              <a href="/business/${b.businessId ?? b.id}"
                style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:white;background:#068562;padding:5px 12px;border-radius:8px;text-decoration:none">
                Ver negocio →
              </a>
            </div>`
          )
          .addTo(map);
        if (isFocused) focusMarker = marker;
      });

    focusMarker?.openPopup();

    mapRef.current = map;

    return () => {
      // map.remove() limpia _leaflet_id del DOM, permitiendo re-init correcto en Strict Mode
      map.remove();
      mapRef.current = null;
    };
  }, [businesses, center, zoom, focusId]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
    />
  );
}
