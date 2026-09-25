"use client";

import { useState } from "react";
import { X, Store, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";
import { BusinessBranch } from "@/types";

interface Props {
  conversationId: string;
  businessId: string;
  businessBranches: BusinessBranch[];
  bankEnabled: boolean;
  onCreated: () => void;
  onClose: () => void;
}

// El vendedor crea un apartado para algo que el comprador pidió por chat
// pero que no está subido como producto — aquí el vendedor sí define
// nombre/precio/anticipo libremente (create_reservation solo lo permite
// porque esta ruta ya confirma que quien llama es el dueño del negocio).
export default function CreateReservationModal({ conversationId, businessId, businessBranches, bankEnabled, onCreated, onClose }: Props) {
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup_branch" | "home">("pickup_branch");
  const [branchId, setBranchId] = useState("");
  const [street, setStreet] = useState("");
  const [colonia, setColonia] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "in_person">("in_person");
  const [saving, setSaving] = useState(false);

  const priceNum = parseFloat(unitPrice) || 0;
  const depositNum = parseFloat(depositAmount) || 0;

  const canSubmit =
    itemName.trim() !== "" &&
    priceNum > 0 &&
    depositNum > 0 &&
    depositNum <= priceNum * quantity &&
    (deliveryMethod === "pickup_branch" || (street.trim() !== "" && phone.trim() !== ""));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "custom",
          business_id: businessId,
          conversation_id: conversationId,
          item_name: itemName.trim(),
          item_description: itemDescription.trim() || undefined,
          unit_price: priceNum,
          deposit_amount: depositNum,
          quantity,
          delivery_method: deliveryMethod,
          branch_id: deliveryMethod === "pickup_branch" ? branchId || null : null,
          address: deliveryMethod === "home" ? { street, colonia, phone } : null,
          payment_method: paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo crear el apartado");
        setSaving(false);
        return;
      }
      toast.success("Apartado creado");
      onCreated();
    } catch {
      toast.error("No se pudo crear el apartado");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Crear apartado</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Artículo</label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} className="input" placeholder="Ej: Taladro percutor" />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="input" placeholder="Detalles, color, modelo..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Precio</label>
              <input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="input" placeholder="890.00" />
            </div>
            <div>
              <label className="label">Cantidad</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Anticipo</label>
            <input type="number" min={0} step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="input" placeholder="200.00" />
            {priceNum > 0 && depositNum > priceNum * quantity && (
              <p className="text-xs text-red-500 mt-1">El anticipo no puede ser mayor al total ({formatPrice(priceNum * quantity)}).</p>
            )}
          </div>

          <div>
            <label className="label">¿Cómo lo recibe?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup_branch")}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-colors ${
                  deliveryMethod === "pickup_branch" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400"
                }`}
              >
                <Store className="w-4 h-4" /> Recoge en sucursal
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("home")}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-colors ${
                  deliveryMethod === "home" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400"
                }`}
              >
                <Truck className="w-4 h-4" /> Se lo envías
              </button>
            </div>
          </div>

          {deliveryMethod === "pickup_branch" && (
            <div>
              <label className="label">Sucursal</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input">
                <option value="">Sucursal principal</option>
                {businessBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {deliveryMethod === "home" && (
            <div className="space-y-3">
              <div>
                <label className="label">Calle y número</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} className="input" placeholder="Av. Juárez 123" />
              </div>
              <div>
                <label className="label">Colonia</label>
                <input value={colonia} onChange={(e) => setColonia(e.target.value)} className="input" placeholder="Centro" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="418 123 4567" />
              </div>
            </div>
          )}

          <div>
            <label className="label">¿Cómo va a pagar el anticipo?</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "transfer" | "in_person")} className="input">
              <option value="in_person">En persona</option>
              <option value="transfer" disabled={!bankEnabled}>Transferencia{!bankEnabled ? " (agrega tu CLABE en Configuración)" : ""}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="button" onClick={handleSubmit} disabled={!canSubmit || saving} className="btn-primary flex-1">
              {saving ? "Creando..." : "Crear apartado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
