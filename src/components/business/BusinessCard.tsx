"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Business } from "@/types";
import { MapPin, Star, Tag } from "lucide-react";
import BusinessFavoriteButton from "@/components/ui/BusinessFavoriteButton";
import { useUserLocation } from "@/lib/user-location-context";
import { distanceKm, formatDistance } from "@/lib/utils";

interface Props {
  business: Business;
}

export default function BusinessCard({ business }: Props) {
  const router = useRouter();
  const { coords } = useUserLocation();
  const hasCoords = business.latitude != null && business.longitude != null;
  const distance =
    coords && hasCoords
      ? distanceKm(coords.latitude, coords.longitude, business.latitude!, business.longitude!)
      : null;

  // La tarjeta entera es un <Link> al negocio; esto navega al mapa en vez
  // de eso, así que hay que interceptar el click antes de que burbujee.
  const goToMap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/map?business=${business.id}`);
  };

  const demoSlugs: Record<string, string> = {
    "demo":             "/business/demo",
    "demo-lavado":      "/business/demo-lavado",
    "demo-cerrajero":   "/business/demo-cerrajero",
    "demo-pintor":      "/business/demo-pintor",
    "demo-salon":       "/business/demo-salon",
    "demo-farmacia":    "/business/demo-farmacia",
    "demo-taller":      "/business/demo-taller",
    "demo-veterinaria": "/business/demo-veterinaria",
    "demo-papeleria":   "/business/demo-papeleria",
    "demo-muebles":     "/business/demo-muebles",
    "demo-artesanias":  "/business/demo-artesanias",
    "demo-deportes":    "/business/demo-deportes",
    "demo-optica":      "/business/demo-optica",
    "demo-floristeria": "/business/demo-floristeria",
    "demo-relojeria":   "/business/demo-relojeria",
    "demo-bicicletas":  "/business/demo-bicicletas",
    "demo-jugueteria":  "/business/demo-jugueteria",
  };
  const href = demoSlugs[business.id] ?? `/business/${business.id}`;
  const isDemo = business.id.startsWith("demo");

  return (
    <Link href={href}>
      <div className="card hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 dark:hover:bg-white/10 transition-all duration-200 group cursor-pointer">
        {/* Imagen */}
        <div className="relative h-44 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/50 dark:to-brand-800/50 overflow-hidden">
          {business.image_url ? (
            <Image
              src={business.image_url}
              alt={business.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">🏪</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent dark:from-black/40" />
          <div className="absolute top-3 left-3">
            <span className="badge bg-white/90 text-slate-700 border border-slate-200/80 text-xs dark:bg-black/50 dark:text-white dark:border-white/20">
              <Tag className="w-3 h-3 mr-1" />
              {business.category}
            </span>
          </div>
          {!isDemo && <BusinessFavoriteButton businessId={business.id} />}
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors line-clamp-1">
            {business.name}
          </h3>
          {business.description && (
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{business.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            {hasCoords ? (
              <button
                type="button"
                onClick={goToMap}
                title="Ver en el mapa"
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 flex-shrink-0" />
                <span className="truncate max-w-[130px] underline decoration-dotted">{business.address}</span>
                {distance != null && (
                  <span className="text-brand-600 dark:text-brand-400 font-medium flex-shrink-0">
                    · {formatDistance(distance)}
                  </span>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 flex-shrink-0" />
                <span className="truncate max-w-[130px]">{business.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-gray-200">
                {business.rating_avg > 0 ? Number(business.rating_avg).toFixed(1) : "Nuevo"}
              </span>
              {business.rating_count > 0 && (
                <span className="text-xs text-slate-400 dark:text-gray-500">({business.rating_count})</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
