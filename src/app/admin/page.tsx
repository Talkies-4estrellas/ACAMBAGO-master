import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Business } from "@/types";
import AdminApproveButton from "./AdminApproveButton";
import AdminBusinessActions from "./AdminBusinessActions";
import ApprovedBusinessesList from "./ApprovedBusinessesList";
import AdminNotificationBell from "./AdminNotificationBell";
import UsersTable, { type Profile } from "./UsersTable";
import AdminProfileSection from "./AdminProfileSection";
import CategoryIcon from "@/components/ui/CategoryIcon";
import {
  CheckCircle, Store, Users, Package, Clock,
  AlertCircle, ShieldCheck, MapPin, LayoutDashboard, History, ShoppingBag, DollarSign, Crown, User,
} from "lucide-react";
import Link from "next/link";
import { DEMO_BUSINESSES, DEMO_PRODUCTS } from "@/lib/demo-data";

interface AuditEntry {
  id: string;
  admin_name: string | null;
  action: string;
  target_type: "business" | "user";
  target_label: string | null;
  created_at: string;
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  business_approve: "aprobó",
  business_suspend: "suspendió",
  business_reactivate: "reactivó",
  business_delete: "eliminó",
  user_role_change: "cambió el rol de",
};

async function getData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isDemo = !url || url.includes("your-project") || url === "https://placeholder.supabase.co";

  if (isDemo) {
    const demoUsers: Profile[] = [
      { id: "1", name: "Admin Principal",      role: "admin",    created_at: "2024-01-01T00:00:00Z" },
      { id: "2", name: "Ferretería Acámbaro",  role: "business", created_at: "2024-01-05T00:00:00Z" },
      { id: "3", name: "Boutique Acámbaro",    role: "business", created_at: "2024-02-01T00:00:00Z" },
      { id: "4", name: "María González",        role: "client",   created_at: "2024-02-10T00:00:00Z" },
      { id: "5", name: "Carlos Ramírez",        role: "client",   created_at: "2024-02-15T00:00:00Z" },
    ];
    return {
      isDemo: true,
      currentUserId: "1",
      pending: [] as (Business & { profiles: { name: string } })[],
      approvedCount: DEMO_BUSINESSES.length,
      usersCount: demoUsers.length,
      productsCount: DEMO_PRODUCTS.length,
      ordersCount: 12,
      confirmedSales: 6540,
      allBusinesses: DEMO_BUSINESSES as Business[],
      users: demoUsers,
      auditLog: [] as AuditEntry[],
    };
  }

  try {
    const { userId } = await auth();
    if (!userId) redirect("/login");
    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "admin") redirect("/");

    const [pendingRes, allBizRes, usersRes, productsRes, auditRes, ordersRes] = await Promise.all([
      supabase.from("businesses").select("*, profiles(name)").eq("is_approved", false).order("created_at", { ascending: false }),
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name, phone, role, created_at").order("created_at", { ascending: false }),
      supabase.from("products").select("id", { count: "exact" }),
      // best-effort: la tabla existe solo si ya se corrio supabase/admin-audit-log.sql
      supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.from("orders").select("total, status"),
    ]);

    const all = (allBizRes.data ?? []) as Business[];
    const orders = ordersRes.data ?? [];
    return {
      isDemo: false,
      currentUserId: userId,
      pending: (pendingRes.data ?? []) as (Business & { profiles: { name: string } })[],
      approvedCount: all.filter((b) => b.is_approved).length,
      usersCount: usersRes.data?.length ?? 0,
      productsCount: productsRes.count ?? 0,
      ordersCount: orders.length,
      confirmedSales: orders.filter((o) => o.status === "entregado").reduce((sum, o) => sum + Number(o.total), 0),
      allBusinesses: all,
      users: (usersRes.data ?? []) as Profile[],
      auditLog: (auditRes.data ?? []) as AuditEntry[],
    };
  } catch {
    redirect("/login");
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "resumen" } = await searchParams;
  const { isDemo, currentUserId, pending, approvedCount, usersCount, productsCount, ordersCount, confirmedSales, allBusinesses, users, auditLog } =
    await getData();

  const approvedBusinesses = allBusinesses.filter((b) => b.is_approved);
  const recentBusinesses = allBusinesses.slice(0, 5);
  const recentUsers = users.slice(0, 5);
  const roleIcon = { admin: Crown, business: Store, client: User } as const;

  const tabs = [
    { id: "resumen",   label: "Resumen",   icon: LayoutDashboard },
    { id: "negocios",  label: "Negocios",  icon: Store, badge: pending.length > 0 ? pending.length : undefined },
    { id: "usuarios",  label: "Usuarios",  icon: Users },
    { id: "perfil",    label: "Mi perfil", icon: User },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Acom-Di — administración completa</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 px-3 py-1.5 rounded-full font-medium">
              Modo demo
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin verificado
          </span>
          {!isDemo && <AdminNotificationBell userId={currentUserId} />}
        </div>
      </div>

      {/* Tabs (solo mobile — en desktop ya está el mismo menú en el sidebar) */}
      <div className="lg:hidden flex gap-1 mb-8 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === "resumen" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Pendientes",         value: pending.length,   icon: Clock,        color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400", alert: pending.length > 0, href: "/admin?tab=negocios" },
              { label: "Negocios aprobados", value: approvedCount,    icon: CheckCircle,  color: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",   href: "/admin?tab=negocios" },
              { label: "Usuarios",           value: usersCount,       icon: Users,        color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",        href: "/admin?tab=usuarios" },
              { label: "Productos",          value: productsCount,    icon: Package,      color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", href: "/admin?tab=negocios" },
              { label: "Pedidos totales",    value: ordersCount,      icon: ShoppingBag,  color: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400", href: undefined },
              { label: "Ventas confirmadas", value: `$${confirmedSales.toLocaleString("es-MX")}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", href: undefined },
            ].map(({ label, value, icon: Icon, color, alert, href }) => {
              const content = (
                <>
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                  {alert && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Requiere atención
                    </p>
                  )}
                </>
              );
              return href ? (
                <Link key={label} href={href} className="card p-5 hover:shadow-md transition-all group">
                  {content}
                </Link>
              ) : (
                <div key={label} className="card p-5">{content}</div>
              );
            })}
          </div>

          {pending.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Pendientes de aprobación
              </h2>
              <div className="space-y-3">
                {pending.slice(0, 3).map((b) => (
                  <div key={b.id} className="card p-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{b.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{b.category} · {b.address}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dueño: {(b as Business & { profiles?: { name: string } }).profiles?.name ?? "—"}</p>
                    </div>
                    {!isDemo && <AdminApproveButton businessId={b.id} />}
                  </div>
                ))}
                {pending.length > 3 && (
                  <Link href="/admin?tab=negocios" className="block text-center text-sm text-brand-600 dark:text-brand-400 hover:underline py-2">
                    Ver {pending.length - 3} más en Negocios...
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-400" /> Últimos negocios registrados
              </h2>
              <div className="card divide-y divide-slate-100 dark:divide-white/5">
                {recentBusinesses.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">Todavía no hay negocios registrados.</p>
                ) : (
                  recentBusinesses.map((b) => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CategoryIcon category={b.category} className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{b.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        b.is_approved
                          ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {b.is_approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Últimos usuarios registrados
              </h2>
              <div className="card divide-y divide-slate-100 dark:divide-white/5">
                {recentUsers.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">Todavía no hay usuarios registrados.</p>
                ) : (
                  recentUsers.map((u) => {
                    const RIcon = roleIcon[u.role];
                    return (
                      <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <RIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name ?? "—"}</span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                          {new Date(u.created_at).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {!isDemo && auditLog.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" /> Actividad reciente
              </h2>
              <div className="card divide-y divide-slate-100 dark:divide-white/5">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{entry.admin_name ?? "Un admin"}</span>
                      {" "}{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}{" "}
                      <span className="font-medium text-slate-900 dark:text-white">{entry.target_label ?? "—"}</span>
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {new Date(entry.created_at).toLocaleString("es-MX")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEGOCIOS ── */}
      {tab === "negocios" && (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Pendientes de aprobación
                <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">{pending.length}</span>
              </h2>
              <div className="space-y-3">
                {pending.map((b) => (
                  <div key={b.id} className="card p-4 flex items-start justify-between gap-4 flex-wrap border-l-4 border-l-yellow-400">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon category={b.category} className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{b.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{b.category}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {b.address}
                        </p>
                      </div>
                    </div>
                    {!isDemo && <AdminBusinessActions businessId={b.id} businessName={b.name} isApproved={false} isActive={false} />}
                    {isDemo && <span className="text-xs text-slate-400 italic">Demo</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Negocios aprobados
              <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{approvedBusinesses.length}</span>
            </h2>
            <ApprovedBusinessesList businesses={approvedBusinesses} isDemo={isDemo} />
          </div>
        </div>
      )}

      {/* ── USUARIOS ── */}
      {tab === "usuarios" && (
        <UsersTable users={users} currentUserId={currentUserId} isDemo={isDemo} />
      )}

      {/* ── MI PERFIL ── */}
      {tab === "perfil" && !isDemo && <AdminProfileSection />}
      {tab === "perfil" && isDemo && (
        <p className="text-sm text-slate-400 dark:text-slate-500">Conecta Supabase para editar tu perfil de admin.</p>
      )}
    </div>
  );
}
