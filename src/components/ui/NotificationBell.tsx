"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({ href }: { href: string }) {
  const { user, isLoaded } = useUser();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const supabase = createClient();
    const instanceId = Math.random().toString(36).slice(2);

    const load = () => {
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .then(({ count }) => setUnread(count ?? 0));
    };
    load();

    // Navbar (mobile) y DesktopSidebar montan esta misma campana a la vez
    // (una queda oculta por CSS, no por render condicional), así que cada
    // instancia necesita su propio nombre de canal: Supabase reutiliza el
    // canal si el nombre coincide y truena al hacer .on() tras el subscribe()
    // que ya hizo la otra instancia.
    const channel = supabase
      .channel(`notifications-${user.id}-${instanceId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoaded, user?.id]);

  if (!user) return null;

  return (
    <Link
      href={href}
      className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
      aria-label="Notificaciones"
      title="Notificaciones"
    >
      <Bell className="w-4 h-4 text-slate-500 dark:text-gray-400" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
