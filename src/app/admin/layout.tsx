import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, LayoutDashboard, Store, Users, Globe } from "lucide-react";
import AdminNav from "./AdminNav";

export const metadata = { title: "Admin — Acom-Di" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 dark:border-white/10 fixed inset-y-0 left-0 bg-white dark:bg-[#040a14]/90 dark:backdrop-blur-md">
        {/* Logo + badge */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="h-8 bg-white rounded-xl px-2 flex items-center shadow-sm">
              <Image src="/acomdi.png" alt="Acom-Di" width={60} height={24} className="h-6 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2.5 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3 h-3" />
            Panel Admin
          </div>
        </div>

        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60">
        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between bg-white/90 dark:bg-[#040a14]/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="h-8 bg-white rounded-xl px-2 flex items-center shadow-sm">
              <Image src="/acomdi.png" alt="Acom-Di" width={60} height={24} className="h-6 w-auto object-contain" />
            </div>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-white/10 flex z-40 bg-white/95 dark:bg-[#040a14]/95 backdrop-blur-md">
          {[
            { href: "/admin?tab=resumen",  label: "Resumen",   icon: LayoutDashboard },
            { href: "/admin?tab=negocios", label: "Negocios",  icon: Store },
            { href: "/admin?tab=usuarios", label: "Usuarios",  icon: Users },
            { href: "/",                   label: "Ver sitio", icon: Globe },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <main className="p-4 lg:p-8 pb-24 lg:pb-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
