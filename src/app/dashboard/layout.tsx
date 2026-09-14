import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import LogoutButton from "@/components/ui/LogoutButton";
import UserInfo from "@/components/ui/UserInfo";
import NotificationBell from "@/components/ui/NotificationBell";
import DashboardNav from "./DashboardNav";
import DemoBanner from "@/components/ui/DemoBanner";
import PendingApprovalGate from "./PendingApprovalGate";
import OrderAlertListener from "@/components/ui/OrderAlertListener";
import { Store, ShoppingBag, LayoutDashboard, Package, Ticket, Settings } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Demo seller bypasses role check (middleware already blocked demo buyer),
  // pero solo si no hay una sesion real de Clerk activa — si ya iniciaste
  // sesion de verdad, la cookie de demo no debe tapar tu cuenta real.
  const cookieStore = await cookies();
  const { userId } = await auth();
  const isDemoSeller = !userId && cookieStore.get("demo_mode")?.value === "seller";

  let pendingApproval = false;
  let businessId: string | null = null;

  if (!isDemoSeller && !IS_DEMO) {
    if (!userId) redirect("/login");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "business" && profile?.role !== "admin") {
      redirect("/");
    }

    if (profile.role === "business") {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, is_approved")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true });

      if (!businesses || businesses.length === 0) {
        redirect("/perfil/crear-tienda");
      }

      const activeBusinessId = cookieStore.get("current_business_id")?.value;
      const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0];
      pendingApproval = !activeBusiness.is_approved;
      businessId = activeBusiness.id;
    }
  }
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#030810]">
      {businessId && <OrderAlertListener businessId={businessId} />}
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-white/10 fixed inset-y-0 left-0 bg-white dark:bg-[#040a14]/90 dark:backdrop-blur-md z-40">
        {/* Logo + modo badge */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <div className="h-9 bg-white rounded-xl px-2 flex items-center shadow-sm">
                <Image src="/acomdi.png" alt="Acom-Di" width={70} height={28} className="h-7 w-auto object-contain" />
              </div>
            </Link>
            <NotificationBell href="/dashboard/business/notificaciones" />
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-brand-500/10 dark:bg-brand-500/15 rounded-xl border border-brand-200 dark:border-brand-500/30">
            <Store className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Modo Vendedor</span>
          </div>
        </div>

        <UserInfo />
        <DashboardNav />

        <div className="p-3 border-t border-slate-200 dark:border-white/10 space-y-1">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:ml-64">
        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between bg-white/90 dark:bg-[#040a14]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link href="/">
              <div className="h-8 bg-white rounded-xl px-2 flex items-center shadow-sm">
                <Image src="/acomdi.png" alt="Acom-Di" width={60} height={24} className="h-6 w-auto object-contain" />
              </div>
            </Link>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-500/20">
              Vendedor
            </span>
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-shrink justify-end">
            <NotificationBell href="/dashboard/business/notificaciones" />
            <UserInfo variant="topbar" />
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-white/10 flex z-40 bg-white/95 dark:bg-[#040a14]/95 backdrop-blur-md">
          {[
            { href: "/dashboard/business",              label: "Inicio",    icon: LayoutDashboard },
            { href: "/dashboard/business/products",     label: "Productos", icon: Package },
            { href: "/dashboard/business/orders",       label: "Pedidos",   icon: ShoppingBag },
            { href: "/dashboard/business/coupons",      label: "Cupones",   icon: Ticket },
            { href: "/dashboard/business/settings",     label: "Config.",   icon: Settings },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-slate-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors">
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <DemoBanner />
        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          <PendingApprovalGate pendingApproval={pendingApproval}>{children}</PendingApprovalGate>
        </main>
      </div>
    </div>
  );
}
