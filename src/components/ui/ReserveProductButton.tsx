"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Bookmark, X, Store, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";
import { BusinessBranch } from "@/types";

interface Props {
  product: { id: string; business_id: string; name: string; price: number; deposit_amount: number };
  businessBranches: BusinessBranch[];
  bankEnabled: boolean;
}

// Aparta un producto del catálogo pagando solo el anticipo ya configurado
// por el vendedor (product.deposit_amount) — el precio/anticipo reales
// siempre se vuelven a leer del servidor en create_reservation, esto solo
// se usa para mostrarlos.
export default function ReserveProductButton({ product, businessBranches, bankEnabled }: Props) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup_branch" | "home">("pickup_branch");
  const [branchId, setBranchId] = useState<string>("");
  const [street, setStreet] = useState("");
  const [colonia, setColonia] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "in_person">("in_person");
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    if (!isLoaded) return;
    if (!user) {
      router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
  };

  const canSubmit =
    deliveryMethod === "pickup_branch" ||
    (deliveryMethod === "home" && street.trim() !== "" && phone.trim() !== "");

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "catalog",
          business_id: product.business_id,
          product_id: product.id,
          quantity,
          delivery_method: deliveryMethod,
          branch_id: deliveryMethod === "pickup_branch" ? branchId || null : null,
          address: deliveryMethod === "home" ? { street, colonia, phone } : null,
          payment_method: paymentMethod,
          customer_name: user.fullName ?? user.firstName ?? "Cliente",
          customer_phone: phone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo crear el apartado");
        setSaving(false);
        return;
      }
      toast.success("Apartado creado. Revísalo en Mis apartados.");
      setOpen(false);
      router.push("/perfil/apartados");
    } catch {
      toast.error("No se pudo crear el apartado");
      setSaving(false);
    }
  };

  const totalPreview = product.price * quantity;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border-2 border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Apartar con {formatPrice(product.deposit_amount)} de anticipo
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Apartar {product.name}</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Cantidad</label>
                <input
                  type="number" min={1} value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input"
                />
              </div>

              <div>
                <label className="label">¿Cómo lo recibes?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("pickup_branch")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-colors ${
                      deliveryMethod === "pickup_branch" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400"
                    }`}
                  >
                    <Store className="w-4 h-4" /> Recoger en sucursal
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("home")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-colors ${
                      deliveryMethod === "home" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400"
                    }`}
                  >
                    <Truck className="w-4 h-4" /> A domicilio
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
                    <label className="label">Teléfono de contacto</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="418 123 4567" />
                  </div>
                </div>
              )}

              <div>
                <label className="label">¿Cómo vas a pagar el anticipo?</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "transfer" | "in_person")} className="input">
                  <option value="in_person">En persona</option>
                  <option value="transfer" disabled={!bankEnabled}>Transferencia{!bankEnabled ? " (no disponible)" : ""}</option>
                </select>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-sm space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Total</span><span>{formatPrice(totalPreview)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Anticipo a pagar ahora</span><span className="text-brand-600 dark:text-brand-400">{formatPrice(product.deposit_amount)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="button" onClick={handleSubmit} disabled={!canSubmit || saving} className="btn-primary flex-1">
                  {saving ? "Apartando..." : "Confirmar apartado"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
