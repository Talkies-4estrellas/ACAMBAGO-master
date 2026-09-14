"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ScanLine, CheckCircle, XCircle, Camera, User, Calendar, Hash, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import { playNotificationSound } from "@/lib/notification-sound";
import { formatPrice } from "@/lib/utils";

const QRScanner = dynamic(() => import("@/components/coupons/QRScanner"), { ssr: false });

interface CouponInfo {
  title: string;
  discount_type: string;
  value: number;
  code: string;
}

interface PendingRedemption {
  qrData: string;
  customerUserId: string | null;
  coupon: CouponInfo;
  businessName: string | null;
  customerName: string | null;
}

interface ScanResult {
  success: boolean;
  message: string;
  coupon?: CouponInfo;
  customerName?: string | null;
  redemptionId?: string | null;
  confirmedAt?: string;
  saleAmount?: number | null;
  discountAmount?: number | null;
  finalAmount?: number | null;
}

// Calcula el mismo desglose que el servidor, solo para mostrar una vista
// previa instantánea mientras el vendedor escribe el monto — el cálculo
// que de verdad se guarda lo hace el RPC en el servidor al confirmar,
// no este.
function previewDiscount(coupon: CouponInfo, saleAmount: number) {
  const discount =
    coupon.discount_type === "percent"
      ? Math.round(saleAmount * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, saleAmount);
  return { discount, final: saleAmount - discount };
}

// Estados del flujo: idle -> scanning -> previewing -> pending (confirmar) -> confirming -> result
type Step = "idle" | "scanning" | "previewing" | "pending" | "confirming" | "result";

export default function ScanPage() {
  const [step, setStep] = useState<Step>("idle");
  const [pending, setPending] = useState<PendingRedemption | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [saleAmount, setSaleAmount] = useState("");

  // Paso 1: leer el QR y solo VALIDAR (confirm: false) — no marca nada como
  // usado todavía. Si es válido, se muestra la info del cliente/cupón y se
  // espera a que el vendedor toque "Confirmar canje".
  const handleScan = async (qrData: string) => {
    setStep("previewing");

    let customerUserId: string | null = null;
    try {
      customerUserId = JSON.parse(qrData)?.user_id ?? null;
    } catch {
      // qr_data invalido; se manda igual y el endpoint lo rechaza
    }

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_data: qrData, user_id: customerUserId, confirm: false }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPending({
          qrData,
          customerUserId,
          coupon: data.coupon,
          businessName: data.business_name ?? null,
          customerName: data.customer_name ?? null,
        });
        setStep("pending");
      } else {
        setResult({ success: false, message: data.error ?? "Cupón inválido" });
        setStep("result");
      }
    } catch {
      setResult({ success: false, message: "Error de conexión. Intenta de nuevo." });
      setStep("result");
    }
  };

  // Paso 2: el vendedor ya vio la info y confirma. Esta es la llamada que
  // realmente marca el cupón como usado (confirm: true).
  const handleConfirm = async () => {
    if (!pending) return;
    setStep("confirming");
    const parsedSaleAmount = parseFloat(saleAmount);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_data: pending.qrData,
          user_id: pending.customerUserId,
          confirm: true,
          sale_amount: parsedSaleAmount > 0 ? parsedSaleAmount : undefined,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: "Cupón canjeado exitosamente",
          coupon: data.coupon,
          customerName: data.customer_name ?? pending.customerName,
          redemptionId: data.redemption_id,
          confirmedAt: new Date().toISOString(),
          saleAmount: data.sale_amount,
          discountAmount: data.discount_amount,
          finalAmount: data.final_amount,
        });
        playNotificationSound();
      } else {
        // Alguien más canjeó este mismo cupón entre el escaneo y la
        // confirmación (ej. otro empleado, u otro dispositivo) — se
        // muestra el motivo real en vez de fingir que se confirmó.
        setResult({ success: false, message: data.error ?? "No se pudo confirmar el canje" });
      }
    } catch {
      setResult({ success: false, message: "Error de conexión. Intenta de nuevo." });
    }

    setStep("result");
  };

  const cancelPending = () => {
    setPending(null);
    setSaleAmount("");
    setStep("idle");
  };

  const reset = () => {
    setResult(null);
    setPending(null);
    setSaleAmount("");
    setStep("idle");
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center">
          <ScanLine className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escáner QR</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Valida cupones de clientes</p>
        </div>
      </div>

      {/* Scanner trigger */}
      {step === "idle" && (
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Listo para escanear</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Pide al cliente que muestre su código QR del cupón y presiona el botón para escanearlo.
          </p>
          <button
            onClick={() => setStep("scanning")}
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            <ScanLine className="w-4 h-4" />
            Iniciar cámara
          </button>
        </div>
      )}

      {/* Previewing / confirming: spinner */}
      {(step === "previewing" || step === "confirming") && (
        <div className="card p-8 text-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {step === "previewing" ? "Validando cupón..." : "Confirmando canje..."}
          </p>
        </div>
      )}

      {/* Pending: muestra info del cliente/cupon y pide confirmar */}
      {step === "pending" && pending && (
        <div className="card p-6 border-brand-200 dark:border-brand-500/30">
          <div className="flex flex-col items-center text-center gap-3">
            <CheckCircle className="w-14 h-14 text-brand-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cupón válido, revisa antes de confirmar</h2>

            <div className="w-full bg-gray-50 dark:bg-white/5 rounded-xl p-4 mt-1 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{pending.customerName ?? "Cliente no identificado"}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                <p className="font-semibold text-gray-900 dark:text-white">{pending.coupon.title}</p>
                <p className="text-brand-600 dark:text-brand-400 font-bold">
                  {pending.coupon.discount_type === "percent"
                    ? `${pending.coupon.value}% de descuento`
                    : `$${pending.coupon.value} MXN de descuento`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{pending.coupon.code}</p>
              </div>
            </div>

            <div className="w-full text-left">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Total de la venta (opcional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="Ej: 500"
                className="input"
              />
              {parseFloat(saleAmount) > 0 && (() => {
                const { discount, final } = previewDiscount(pending.coupon, parseFloat(saleAmount));
                return (
                  <div className="mt-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-sm space-y-1">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Descuento</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-white/10">
                      <span>Total a cobrar</span>
                      <span>{formatPrice(final)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="w-full flex gap-2 mt-2">
              <button
                onClick={cancelPending}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                Confirmar canje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {step === "result" && result && (
        <div className={`card p-6 ${result.success
          ? "border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10"
          : "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"}`}>
          <div className="flex flex-col items-center text-center gap-3">
            {result.success ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}

            <h2 className={`text-xl font-bold ${result.success
              ? "text-green-800 dark:text-green-300"
              : "text-red-800 dark:text-red-300"}`}>
              {result.success ? "✅ Cupón válido" : "Cupón rechazado"}
            </h2>
            <p className={`text-sm ${result.success
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"}`}>
              {result.message}
            </p>

            {result.success && result.coupon && (
              <div className="w-full bg-white dark:bg-white/10 rounded-xl p-4 mt-2 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{result.customerName ?? "Cliente no identificado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {result.confirmedAt && new Date(result.confirmedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                {result.redemptionId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{result.redemptionId.slice(0, 8)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                  <p className="font-semibold text-gray-900 dark:text-white">{result.coupon.title}</p>
                  <p className="text-brand-600 dark:text-brand-400 font-bold text-lg mt-1">
                    {result.coupon.discount_type === "percent"
                      ? `${result.coupon.value}% de descuento`
                      : `$${result.coupon.value} MXN de descuento`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{result.coupon.code}</p>
                </div>

                {result.saleAmount != null && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Total de la venta</span>
                      <span>{formatPrice(result.saleAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Descuento aplicado</span>
                      <span>-{formatPrice(result.discountAmount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-1">
                      <span>Total a cobrar</span>
                      <span className="text-green-600 dark:text-green-400">{formatPrice(result.finalAmount ?? 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className={`w-full mt-2 py-2.5 rounded-xl font-semibold text-sm transition-colors ${result.success
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"}`}
            >
              Escanear otro cupón
            </button>
          </div>
        </div>
      )}

      {/* Scanner modal */}
      {step === "scanning" && (
        <QRScanner onScan={handleScan} onClose={() => setStep("idle")} />
      )}

      {/* History hint */}
      {step === "idle" && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            El sistema valida automáticamente: código único, fecha de vencimiento, límite de usos, duplicados y que el cupón sea de tu tienda.
          </p>
        </div>
      )}
    </div>
  );
}
