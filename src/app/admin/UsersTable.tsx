"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Store, User, Search } from "lucide-react";
import toast from "react-hot-toast";

export interface Profile {
  id: string;
  name: string;
  phone?: string;
  role: "client" | "business" | "admin";
  created_at: string;
}

const roleConfig = {
  admin:    { label: "Admin",    icon: Crown, bg: "bg-red-50 dark:bg-red-500/10",      text: "text-red-700 dark:text-red-400",      border: "border-red-200 dark:border-red-500/20" },
  business: { label: "Negocio", icon: Store,  bg: "bg-brand-50 dark:bg-brand-500/10",  text: "text-brand-700 dark:text-brand-400",  border: "border-brand-100 dark:border-brand-500/20" },
  client:   { label: "Cliente", icon: User,   bg: "bg-slate-50 dark:bg-slate-700",     text: "text-slate-600 dark:text-slate-300",  border: "border-slate-200 dark:border-slate-600" },
} as const;

interface Props {
  users: Profile[];
  currentUserId: string;
  isDemo: boolean;
}

export default function UsersTable({ users, currentUserId, isDemo }: Props) {
  const [query, setQuery] = useState("");
  const [changingId, setChangingId] = useState<string | null>(null);
  const router = useRouter();

  const admins   = users.filter((u) => u.role === "admin");
  const negocios = users.filter((u) => u.role === "business");
  const clientes = users.filter((u) => u.role === "client");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q) ||
      roleConfig[u.role].label.toLowerCase().includes(q)
    );
  }, [users, query]);

  const handleRoleChange = async (user: Profile, newRole: Profile["role"]) => {
    if (newRole === user.role) return;
    if (newRole === "admin" && !confirm(`¿Convertir a "${user.name}" en administrador? Tendrá acceso completo a este panel.`)) return;

    setChangingId(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo cambiar el rol");
        return;
      }
      toast.success(`${user.name} ahora es ${roleConfig[newRole].label}`);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: "Administradores", count: admins.length,   ...roleConfig.admin },
          { title: "Negocios",        count: negocios.length, ...roleConfig.business },
          { title: "Clientes",        count: clientes.length, ...roleConfig.client },
        ].map(({ title, count, icon: Icon, bg, text, border }) => (
          <div key={title} className={`card p-5 border ${border}`}>
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-2`}>
              <Icon className={`w-5 h-5 ${text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o rol..."
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    Ningún usuario coincide con tu búsqueda.
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const r = roleConfig[u.role];
                const RIcon = r.icon;
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${r.bg} border ${r.border} flex items-center justify-center flex-shrink-0`}>
                          <RIcon className={`w-3.5 h-3.5 ${r.text}`} />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{u.name ?? "—"}</span>
                        {isSelf && <span className="text-xs text-slate-400 dark:text-slate-500">(tú)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isDemo || isSelf ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${r.bg} ${r.text} ${r.border}`}>
                          <RIcon className="w-3 h-3" /> {r.label}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={changingId === u.id}
                          onChange={(e) => handleRoleChange(u, e.target.value as Profile["role"])}
                          className={`text-xs font-medium px-2 py-1 rounded-full border bg-transparent ${r.bg} ${r.text} ${r.border} disabled:opacity-50`}
                        >
                          <option value="client">Cliente</option>
                          <option value="business">Negocio</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {u.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 hidden md:table-cell text-xs">
                      {new Date(u.created_at).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
