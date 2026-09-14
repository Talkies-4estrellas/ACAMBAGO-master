"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  businessId: string;
  businessName: string;
  /** Cuántos cupones asigna este botón. Reusable a futuro: basta con pasar otro número. */
  amount?: number;
}

// Botón "Asignar 10 cupones" del panel de admin. Pide confirmación, llama a
// la API (que valida que quien llama sea admin), y muestra el nuevo saldo
// total en el mensaje de éxito.
export default function AssignCouponsButton({ businessId, businessName, amount = 10 }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    const confirmed = window.confirm(`¿Deseas asignar ${amount} cupones a "${businessName}"?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupon-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "No se pudieron asignar los cupones");
        return;
      }

      toast.success(`${businessName} ahora tiene ${data.new_total} cupones disponibles`);
      router.refresh();
    } catch {
      toast.error("Error de conexión al asignar cupones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
    >
      <Ticket className="w-3.5 h-3.5" /> {loading ? "Asignando..." : `Asignar ${amount} cupones`}
    </button>
  );
}
