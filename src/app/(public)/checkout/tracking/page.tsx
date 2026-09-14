"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Package, Truck, MapPin, Phone, Star, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { playNotificationSound } from "@/lib/notification-sound";
import { Order } from "@/types";

const TRACKING_STEPS = [
  {
    id: "received",
    label: "Pedido recibido",
    sub: "La tienda recibió tu pedido",
    icon: Package,
    color: "brand",
  },
  {
    id: "preparing",
    label: "Preparando",
    sub: "Están preparando tu pedido",
    icon: Clock,
    color: "amber",
  },
  {
    id: "ready",
    label: "Listo para recoger",
    sub: "Tu pedido está listo",
    icon: CheckCircle2,
    color: "blue",
  },
  {
    id: "on_way",
    label: "En camino",
    sub: "Tu pedido va en camino hacia ti",
    icon: Truck,
    color: "purple",
  },
  {
    id: "delivered",
    label: "Entregado",
    sub: "¡Pedido entregado con éxito!",
    icon: Star,
    color: "green",
  },
];

// El status real del pedido solo tiene 3 pasos de progreso (pendiente/en_camino/entregado);
// "cancelado" se muestra aparte como un banner, no dentro de esta línea de tiempo.
const REAL_STEPS = [
  { id: "pendiente", label: "Pedido recibido", sub: "La tienda recibió tu pedido", icon: Package, color: "brand" },
  { id: "en_camino", label: "En camino", sub: "Tu pedido va en camino hacia ti", icon: Truck, color: "purple" },
  { id: "entregado", label: "Entregado", sub: "¡Pedido entregado con éxito!", icon: Star, color: "green" },
];
const REAL_STEP_INDEX: Record<string, number> = { pendiente: 0, en_camino: 1, entregado: 2 };

const COLOR_MAP: Record<string, { bg: string; ring: string; text: string; line: string }> = {
  brand:  { bg: "bg-brand-500",  ring: "ring-brand-200 dark:ring-brand-500/30",  text: "text-brand-600 dark:text-brand-400",  line: "bg-brand-500" },
  amber:  { bg: "bg-amber-500",  ring: "ring-amber-200 dark:ring-amber-500/30",  text: "text-amber-600 dark:text-amber-400",  line: "bg-amber-500" },
  blue:   { bg: "bg-blue-500",   ring: "ring-blue-200 dark:ring-blue-500/30",    text: "text-blue-600 dark:text-blue-400",    line: "bg-blue-500" },
  purple: { bg: "bg-purple-500", ring: "ring-purple-200 dark:ring-purple-500/30",text: "text-purple-600 dark:text-purple-400",line: "bg-purple-500" },
  green:  { bg: "bg-green-500",  ring: "ring-green-200 dark:ring-green-500/30",  text: "text-green-600 dark:text-green-400",  line: "bg-green-500" },
};

// Auto-advance interval in ms for demo
const DEMO_INTERVAL = 4000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

type TrackedOrder = Order & { businesses: { name: string; address: string; whatsapp: string | null } | null };

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order") ?? "ACAM-DEMO";
  const isReal = !IS_DEMO && UUID_RE.test(orderId);

  const [currentStep, setCurrentStep] = useState(0);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [demoDone, setDemoDone] = useState(false);
  const [realOrder, setRealOrder] = useState<TrackedOrder | null>(null);
  const [loadingReal, setLoadingReal] = useState(isReal);

  // Auto-advance demo steps (solo cuando no es un pedido real)
  useEffect(() => {
    if (isReal || demoDone) return;
    const now = new Date();
    const fmt = (d: Date) =>
      d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

    setTimes((prev) => ({ ...prev, [TRACKING_STEPS[0].id]: fmt(now) }));

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= TRACKING_STEPS.length) {
          clearInterval(interval);
          setDemoDone(true);
          return prev;
        }
        const t = new Date();
        setTimes((p) => ({ ...p, [TRACKING_STEPS[next].id]: fmt(t) }));
        return next;
      });
    }, DEMO_INTERVAL);

    return () => clearInterval(interval);
  }, [demoDone, isReal]);

  // Pedido real: carga el estado actual y se suscribe a Realtime para verlo avanzar sin recargar.
  useEffect(() => {
    if (!isReal) return;
    const supabase = createClient();

    supabase
      .from("orders")
      .select("*, order_items(*), businesses(name, address, whatsapp)")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setRealOrder(data as unknown as TrackedOrder);
        setLoadingReal(false);
      });

    const channel = supabase
      .channel(`tracking-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setRealOrder((prev) => (prev ? { ...prev, ...(payload.new as Order) } : prev));
          playNotificationSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isReal, orderId]);

  const isCancelled = isReal && realOrder?.status === "cancelado";
  const steps = isReal ? REAL_STEPS : TRACKING_STEPS;
  const currentIndex = isReal ? (realOrder ? REAL_STEP_INDEX[realOrder.status] ?? 0 : 0) : currentStep;
  const done = isReal ? realOrder?.status === "entregado" : demoDone;

  const storeName = isReal ? realOrder?.businesses?.name ?? "Tu tienda" : "Ferretería Acámbaro";
  const storeAddress = isReal ? realOrder?.businesses?.address ?? "" : "Calle Juárez 45, Centro";
  const storeWhatsapp = isReal ? realOrder?.businesses?.whatsapp : null;

  if (isReal && loadingReal) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030810] max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-16 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030810]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#060e18] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-slate-900 dark:text-white text-base">Seguimiento del pedido</h1>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-mono">{orderId}</p>
          </div>
          {!isCancelled && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">En vivo</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Store card */}
        <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-2xl flex-shrink-0">
            🔧
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{storeName}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500">{storeAddress}</p>
          </div>
          {storeWhatsapp ? (
            <a
              href={`https://wa.me/52${storeWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              Llamar
            </a>
          ) : (
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              Llamar
            </a>
          )}
        </div>

        {/* ETA / cancelled banner */}
        {isCancelled ? (
          <div className="bg-red-500 rounded-2xl p-4 text-white flex items-center gap-3">
            <XCircle className="w-8 h-8 opacity-90 flex-shrink-0" />
            <div>
              <p className="font-bold text-base">Pedido cancelado</p>
              <p className="text-red-100 text-xs mt-0.5">Contacta a la tienda si tienes dudas</p>
            </div>
          </div>
        ) : !done ? (
          <div className="bg-brand-500 rounded-2xl p-4 text-white flex items-center gap-3">
            <Clock className="w-8 h-8 opacity-80 flex-shrink-0" />
            <div>
              <p className="font-bold text-base">Llegada estimada: 15-20 min</p>
              <p className="text-brand-100 text-xs mt-0.5">{isReal ? "Actualizando en tiempo real" : "Actualizando en tiempo real (demo)"}</p>
            </div>
          </div>
        ) : (
          <div className="bg-green-500 rounded-2xl p-4 text-white flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 opacity-90 flex-shrink-0" />
            <div>
              <p className="font-bold text-base">¡Pedido entregado!</p>
              <p className="text-green-100 text-xs mt-0.5">Gracias por tu compra en Acom-Di</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-5">Estado del pedido</p>
            <div className="space-y-0">
              {steps.map((s, i) => {
                const isDone = i < currentIndex;
                const isActive = i === currentIndex;
                const colors = COLOR_MAP[s.color];
                const Icon = s.icon;
                const isLast = i === steps.length - 1;

                return (
                  <div key={s.id} className="flex gap-4">
                    {/* Icon + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isDone
                            ? `${colors.bg} text-white`
                            : isActive
                            ? `${colors.bg} text-white ring-4 ${colors.ring} animate-pulse`
                            : "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-gray-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-8 mt-1 transition-all duration-700 ${
                            isDone ? colors.line : "bg-slate-200 dark:bg-white/10"
                          }`}
                        />
                      )}
                    </div>

                    {/* Text */}
                    <div className={`pb-8 ${isLast ? "pb-0" : ""} flex-1 pt-1.5`}>
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-semibold transition-colors duration-300 ${
                            isDone || isActive
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-400 dark:text-gray-600"
                          }`}
                        >
                          {s.label}
                        </p>
                        {times[s.id] && (
                          <span className="text-xs text-slate-400 dark:text-gray-500">{times[s.id]}</span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 transition-colors duration-300 ${
                          isActive ? colors.text : isDone ? "text-slate-400 dark:text-gray-500" : "text-slate-300 dark:text-gray-700"
                        }`}
                      >
                        {isActive && !done ? (
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="inline-block w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="inline-block w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                            {s.sub}
                          </span>
                        ) : (
                          s.sub
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Map placeholder */}
        {!isCancelled && (
          <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="relative h-36 bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-500/10 dark:to-blue-500/10 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-gray-400">Mapa en vivo</p>
                <p className="text-xs text-slate-400 dark:text-gray-500">(disponible en versión completa)</p>
              </div>
              <div className="absolute inset-0 bg-[url('/acomdi.png')] bg-center bg-no-repeat opacity-5" />
            </div>
            <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-white/10">
              <span className="text-xs text-slate-500 dark:text-gray-400">{storeName} → Tu ubicación</span>
              <button className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Ver en Maps
              </button>
            </div>
          </div>
        )}

        {/* Rate + back */}
        {done && !isReal && (
          <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">¿Cómo fue tu experiencia?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className="text-2xl hover:scale-110 transition-transform">
                  ⭐
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500">(Función demo)</p>
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="w-full py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 font-medium text-sm transition-colors"
        >
          Volver al Marketplace
        </button>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense>
      <TrackingContent />
    </Suspense>
  );
}
