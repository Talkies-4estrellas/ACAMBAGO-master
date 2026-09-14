"use client";

import { useState } from "react";
import { CheckCircle, XCircle, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface Props {
  businessId: string;
  businessName: string;
  isApproved: boolean;
  isActive: boolean;
}

export default function AdminBusinessActions({ businessId, businessName, isApproved, isActive }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();

  const callAction = async (action: "approve" | "suspend" | "reactivate" | "delete", successMessage: string) => {
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
      toast.success(successMessage);
      setConfirmingDelete(false);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const approve = () => callAction("approve", "Negocio aprobado");

  const reject = () => {
    if (!confirm("¿Rechazar y eliminar este negocio permanentemente?")) return;
    callAction("delete", "Negocio eliminado");
  };

  const toggleActive = () => callAction(isActive ? "suspend" : "reactivate", isActive ? "Negocio suspendido" : "Negocio reactivado");

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {!isApproved ? (
          <>
            <button onClick={approve} disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/30 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
              <CheckCircle className="w-3.5 h-3.5" /> Aprobar
            </button>
            <button onClick={reject} disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
              <XCircle className="w-3.5 h-3.5" /> Rechazar
            </button>
          </>
        ) : (
          <>
            <button onClick={toggleActive} disabled={loading}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50 ${
                isActive
                  ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30 hover:bg-yellow-100"
                  : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30 hover:bg-green-100"
              }`}>
              {isActive
                ? <><PauseCircle className="w-3.5 h-3.5" /> Suspender</>
                : <><PlayCircle className="w-3.5 h-3.5" /> Reactivar</>
              }
            </button>
            <button onClick={() => setConfirmingDelete(true)} disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          </>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDeleteDialog
          title={`Eliminar "${businessName}" permanentemente`}
          description="Esto también borra para siempre sus productos, pedidos, reseñas, cupones y mensajes (no se puede deshacer). Si solo quieres ocultarlo del catálogo, usa Suspender en vez de esto."
          confirmText={businessName}
          loading={loading}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => callAction("delete", "Negocio eliminado")}
        />
      )}
    </>
  );
}
