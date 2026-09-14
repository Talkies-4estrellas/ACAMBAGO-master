"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Store, Users, Eye, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const tabs = [
  { id: "resumen",  label: "Resumen",  icon: LayoutDashboard },
  { id: "negocios", label: "Negocios", icon: Store },
  { id: "usuarios", label: "Usuarios", icon: Users },
];

export default function AdminNav() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "resumen";
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {tabs.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={`/admin?tab=${id}`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === id
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </Link>
      ))}

      <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-all"
        >
          <Eye className="w-4 h-4 flex-shrink-0" />
          Ver sitio
        </Link>
        <button
          onClick={async () => { await signOut(); router.push("/"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
