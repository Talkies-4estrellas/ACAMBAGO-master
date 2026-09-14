"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type LocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

interface Coords {
  latitude: number;
  longitude: number;
}

interface UserLocationContextType {
  coords: Coords | null;
  status: LocationStatus;
}

const UserLocationContext = createContext<UserLocationContextType | null>(null);

// Pide la ubicación del navegador una sola vez por sesión (no watchPosition,
// no hace falta seguir al usuario en tiempo real, solo saber que tan lejos
// esta cada tienda). Vive en el layout publico para que todas las tarjetas
// compartan el mismo permiso/resultado en vez de pedirlo cada una por su lado.
export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return (
    <UserLocationContext.Provider value={{ coords, status }}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const ctx = useContext(UserLocationContext);
  if (!ctx) throw new Error("useUserLocation debe usarse dentro de UserLocationProvider");
  return ctx;
}
