"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminApproveButton({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const callAction = async (action: "approve" | "delete") => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo completar la acción");
        return;
      }
      toast.success(action === "approve" ? "Negocio aprobado" : "Negocio rechazado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (!confirm("¿Rechazar y eliminar este negocio?")) return;
    callAction("delete");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => callAction("approve")}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-xl transition-colors"
      >
        <CheckCircle className="w-4 h-4" />
        Aprobar
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Rechazar
      </button>
    </div>
  );
}
