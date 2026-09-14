"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Ticket } from "lucide-react";

export interface CouponFormValues {
  title: string;
  description: string;
  discountType: "percent" | "fixed";
  value: string;
  limitCount: string;
  expiresAt: string;
}

interface Props {
  initialValues?: Partial<CouponFormValues>;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (values: CouponFormValues) => Promise<void>;
  /** Cuando se edita un cupón ya existente, se muestra su QR real en vez del de vista previa. */
  existingQrData?: string;
  existingCode?: string;
}

export default function CouponForm({ initialValues, submitLabel, savingLabel, onSubmit, existingQrData, existingCode }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(initialValues?.discountType ?? "percent");
  const [value, setValue] = useState(initialValues?.value ?? "");
  const [limitCount, setLimitCount] = useState(initialValues?.limitCount ?? "");
  const [expiresAt, setExpiresAt] = useState(initialValues?.expiresAt ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ title, description, discountType, value, limitCount, expiresAt });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Información del cupón</h2>

        <div>
          <label className="label">Título del cupón *</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Ej: 20% en toda la tienda" />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input resize-none" rows={2} placeholder="Condiciones o detalles del descuento" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de descuento *</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")} className="input">
              <option value="percent" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Porcentaje (%)</option>
              <option value="fixed" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Monto fijo ($)</option>
            </select>
          </div>
          <div>
            <label className="label">Valor *</label>
            <input required type="number" min="1" max={discountType === "percent" ? "100" : undefined} step={discountType === "percent" ? "1" : "0.01"} value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder={discountType === "percent" ? "20" : "50.00"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Límite de usos</label>
            <input type="number" min="1" value={limitCount} onChange={(e) => setLimitCount(e.target.value)} className="input" placeholder="Sin límite" />
          </div>
          <div>
            <label className="label">Fecha de vencimiento</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input" min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>
      </div>

      {/* Preview */}
      {title && value && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {existingCode ? "Código QR de este cupón" : "Vista previa del QR"}
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-brand-600 text-white rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold">
                {discountType === "percent" ? `${value}%` : `$${value}`}
              </p>
              <p className="text-sm opacity-80 mt-1">DESCUENTO</p>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
              {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{description}</p>}
              <div className="mt-3 bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                <QRCodeSVG value={existingQrData ?? JSON.stringify({ coupon_code: "ACAM-PREVIEW", business_id: "preview" })} size={180} />
                <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{existingCode ?? "ACAM-XXXXXX"}</p>
                {!existingCode && <p className="text-xs text-gray-400 dark:text-slate-500">Se generará al guardar</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        {saving ? savingLabel : (
          <>
            <Ticket className="w-4 h-4" />
            {submitLabel}
          </>
        )}
      </button>
    </form>
  );
}
