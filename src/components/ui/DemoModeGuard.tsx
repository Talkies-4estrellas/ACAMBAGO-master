"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getDemoMode } from "@/lib/demo-mode";

// Si hay una sesion real de Clerk activa, la cookie demo_mode no debe
// seguir viva — de lo contrario paneles como UserInfo/DemoBanner podian
// mostrar la identidad fija de la demo (ej. "Ferretería Acámbaro") encima
// de una cuenta real ya logueada, mezclando ambas identidades.
export default function DemoModeGuard() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user && getDemoMode()) {
      document.cookie = "demo_mode=; path=/; max-age=0";
    }
  }, [isLoaded, user]);

  return null;
}
