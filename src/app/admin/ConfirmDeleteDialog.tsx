"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  title: string;
  description: string;
  /** Texto que el admin debe escribir exactamente para habilitar el botón — normalmente el nombre del negocio, para evitar borrados por un clic accidental. */
  confirmText: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteDialog({ title, description, confirmText, loading, onClose, onConfirm }: Props) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === confirmText.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          </div>
        </div>

        <div>
          <label className="label">
            Escribe <strong className="text-slate-700 dark:text-slate-200">{confirmText}</strong> para confirmar
          </label>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="input"
            autoFocus
            placeholder={confirmText}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || loading}
            className="flex-1 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 transition-colors"
          >
            {loading ? "Eliminando..." : "Eliminar permanentemente"}
          </button>
        </div>
      </div>
    </div>
  );
}
