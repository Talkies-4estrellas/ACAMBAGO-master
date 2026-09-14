"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { FlaskConical, X } from "lucide-react";
import { getDemoMode, stopDemoMode, DEMO_BUYER, DEMO_SELLER } from "@/lib/demo-mode";

export default function DemoBanner() {
  const { user, isLoaded } = useUser();
  const [mode, setMode] = useState<"buyer" | "seller" | null>(null);

  useEffect(() => {
    // Con una sesion real de Clerk activa, la cookie de demo se ignora.
    if (!isLoaded) return;
    setMode(user ? null : getDemoMode());
  }, [isLoaded, user]);

  if (!mode) return null;

  const label =
    mode === "buyer"
      ? `Comprando como ${DEMO_BUYER.name}`
      : `Vendedor: ${DEMO_SELLER.businessName}`;

  const switchLabel = mode === "buyer" ? "Probar como Tienda" : "Probar como Comprador";
  const switchHref = mode === "buyer" ? "/login" : "/login";

  return (
    <div className="relative z-50 flex items-center justify-between gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium">
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
        <span className="truncate">
          <span className="opacity-70 mr-1">Modo Demo</span>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={switchHref}
          onClick={stopDemoMode}
          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 transition-colors"
        >
          {switchLabel}
        </Link>
        <button
          onClick={stopDemoMode}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}
