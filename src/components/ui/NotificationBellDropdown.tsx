"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  userId: string;
  /** Página de historial completo, enlazada al pie del dropdown ("Ver todas"). */
  viewAllHref: string;
}

// Campana con dropdown al hacer clic, igual patrón que AdminNotificationBell
// pero genérica: cualquier usuario logueado ve sus propias notificaciones
// (misma tabla `notifications`, filtrada por su user_id). El panel se
// renderiza en un portal a document.body y se posiciona con `fixed` a partir
// del rect real del botón, porque el sidebar donde vive la campana tiene
// `overflow-hidden` (necesario para animar su ancho al colapsar) y recortaría
// el dropdown si se posicionara relativo/absoluto dentro de él.
export default function NotificationBellDropdown({ userId, viewAllHref }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const load = () => {
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => setNotifications((data ?? []) as Notif[]));
    };
    load();

    const channel = supabase
      .channel(`notifications-dropdown-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleToggle = async () => {
    const next = !open;
    if (next && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(next);
    if (next && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    }
  };

  const handleClickNotification = (n: Notif) => {
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-pulse" />
        ) : (
          <Bell className="w-4 h-4 text-slate-500 dark:text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          style={{ top: coords.top, right: coords.right }}
          className="fixed w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg z-[100]"
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
            <p className="font-semibold text-sm text-slate-900 dark:text-white">Notificaciones</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-400 dark:text-slate-500 text-center">No tienes notificaciones.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`px-4 py-3 transition-colors ${n.link ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" : ""} ${
                    !n.is_read ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.created_at).toLocaleString("es-MX")}</p>
                </div>
              ))}
            </div>
          )}
          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 border-t border-slate-100 dark:border-white/10"
          >
            Ver todas
          </Link>
        </div>,
        document.body
      )}
    </>
  );
}
