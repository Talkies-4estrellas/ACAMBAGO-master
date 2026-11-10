"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, AlertCircle, Loader2, Ticket } from "lucide-react";

type State =
  | { status: "saving" }
  | { status: "saved"; alreadySaved: boolean; qrValue: string }
  | { status: "error"; message: string };

// Guarda el cupón en cuanto se abre la página con sesión iniciada (también al
// volver de Iniciar sesión / Crear cuenta). La ruta es idempotente, así que
// recargar la página no duplica nada.
export default function SaveCouponPanel({ code, origen }: { code: string; origen: string }) {
  const [state, setState] = useState<State>({ status: "saving" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/saved-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, origen }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.saved) {
          setState({ status: "saved", alreadySaved: !!data.already_saved, qrValue: data.qr_value });
        } else {
          setState({ status: "error", message: data.error ?? "No se pudo guardar el cupón." });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "No se pudo guardar el cupón. Revisa tu conexión." });
      });
    return () => { cancelled = true; };
  }, [code, origen]);

  if (state.status === "saving") {
    return (
      <div className="card p-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Guardando el cupón en tu cuenta...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="card p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 dark:text-slate-300">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-semibold">
        <CheckCircle2 className="w-5 h-5" />
        {state.alreadySaved ? "Este cupón ya estaba en tu cuenta" : "¡Listo! Guardamos el cupón en tu cuenta"}
      </div>
      <div className="inline-block bg-white p-3 rounded-2xl">
        <QRCodeSVG value={state.qrValue} size={200} bgColor="#ffffff" fgColor="#1f2937" level="M" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Este es tu QR personal. Muéstralo en la tienda para que lo escaneen.
      </p>
      <Link href="/perfil/cupones" className="btn-primary inline-flex items-center gap-2 text-sm">
        <Ticket className="w-4 h-4" /> Ver mis cupones
      </Link>
    </div>
  );
}
