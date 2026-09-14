"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Store } from "lucide-react";

// Selector "Mi cuenta / Mi tienda" para cuentas que ya tienen una tienda
// creada. No cambia ningun rol ni cookie: solo navega entre el lado
// comprador y el panel de vendedor de la misma cuenta.
export default function AccountModeSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const inStore = pathname.startsWith("/dashboard");

  if (compact) {
    return inStore ? (
      <Link
        href="/perfil"
        title="Ir a mi cuenta"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex-shrink-0"
      >
        <User className="w-3.5 h-3.5" /> Mi cuenta
      </Link>
    ) : (
      <Link
        href="/dashboard/business"
        title="Ir a mi tienda"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors flex-shrink-0"
      >
        <Store className="w-3.5 h-3.5" /> Mi tienda
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
      <Link
        href="/perfil"
        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
          !inStore
            ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
            : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
        }`}
      >
        <User className="w-3.5 h-3.5" /> Mi cuenta
      </Link>
      <Link
        href="/dashboard/business"
        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
          inStore
            ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
            : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
        }`}
      >
        <Store className="w-3.5 h-3.5" /> Mi tienda
      </Link>
    </div>
  );
}
