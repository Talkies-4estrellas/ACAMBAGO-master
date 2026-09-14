"use client";

import { Coupon, QRPayload } from "@/types";
import { formatDiscount } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, Calendar, Users } from "lucide-react";

interface Props {
  coupon: Coupon;
  showQR?: boolean;
  // Id del comprador que esta viendo el cupon (si esta logueado). Se
  // incrusta en el QR para que el canje se pueda limitar a una vez por
  // persona; sin esto, el mismo QR es identico para cualquiera que lo vea.
  buyerUserId?: string;
}

export default function CouponCard({ coupon, showQR = false, buyerUserId }: Props) {
  const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
  const isFull = coupon.limit_count ? coupon.used_count >= coupon.limit_count : false;
  const isValid = coupon.is_active && !isExpired && !isFull;

  let qrValue = coupon.qr_data;
  if (buyerUserId) {
    try {
      const payload = JSON.parse(coupon.qr_data) as QRPayload;
      qrValue = JSON.stringify({ ...payload, user_id: buyerUserId });
    } catch {
      // qr_data mal formado; se muestra tal cual en vez de tronar
    }
  }

  return (
    <div className={`card flex flex-col sm:flex-row overflow-hidden ${!isValid ? "opacity-60" : ""}`}>
      {/* Discount badge */}
      <div className="bg-brand-600 text-white flex flex-col items-center justify-center px-7 py-5 min-w-[140px]">
        <Ticket className="w-8 h-8 mb-1 opacity-80" />
        <span className="text-3xl font-bold">
          {coupon.discount_type === "percent" ? `${coupon.value}%` : `$${coupon.value}`}
        </span>
        <span className="text-xs opacity-80 uppercase tracking-wide">
          {coupon.discount_type === "percent" ? "descuento" : "de descuento"}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">{coupon.title}</h3>
            {coupon.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{coupon.description}</p>
            )}
          </div>
          <span className={`badge ${isValid ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
            {isValid ? "Válido" : isExpired ? "Expirado" : isFull ? "Agotado" : "Inactivo"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="font-mono bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded font-medium text-gray-800 dark:text-gray-200">
              {coupon.code}
            </span>
          </div>
          {coupon.expires_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Vence: {format(new Date(coupon.expires_at), "dd/MM/yyyy", { locale: es })}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {coupon.limit_count
              ? `${coupon.used_count}/${coupon.limit_count} usos`
              : `${coupon.used_count} ${coupon.used_count === 1 ? "persona lo ha usado" : "personas lo han usado"}`}
          </div>
        </div>
      </div>

      {/* QR */}
      {showQR && isValid && (
        <div className="flex items-center justify-center p-4 border-t sm:border-t-0 sm:border-l border-dashed border-gray-200 dark:border-white/10">
          <div className="flex flex-col items-center gap-1">
            <QRCodeSVG
              value={qrValue}
              size={180}
              bgColor="#ffffff"
              fgColor="#1f2937"
              level="M"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">Escanear en tienda</span>
          </div>
        </div>
      )}
    </div>
  );
}
