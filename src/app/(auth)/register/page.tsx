"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crear cuenta</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Explora tiendas locales de Acámbaro. Si más adelante quieres vender,
          puedes crear tu tienda en cualquier momento desde tu cuenta.
        </p>
      </div>

      <button
        onClick={() => router.push("/signup")}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
      >
        Crear cuenta <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-slate-500 text-sm pt-2">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
