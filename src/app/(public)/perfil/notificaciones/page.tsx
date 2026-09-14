"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, Package, MessageSquare, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

function iconFor(type: Notification["type"]) {
  if (type === "question_answered") return MessageSquare;
  if (type === "new_message") return MessageCircle;
  return Package;
}

export default function NotificacionesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(async ({ data }) => {
        setItems((data ?? []) as Notification[]);
        setLoading(false);
        const unreadIds = ((data ?? []) as Notification[]).filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-500" /> Notificaciones
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Avisos de tus pedidos y preguntas</p>
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">
          Conecta Supabase para ver notificaciones reales.
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no tienes notificaciones.</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-white/10">
          {items.map((n) => {
            const Icon = iconFor(n.type);
            const content = (
              <div className={`px-5 py-3.5 flex items-start gap-3 ${n.link ? "hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" : ""}`}>
                <div className="w-9 h-9 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{format(new Date(n.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
              </div>
            );
            return n.link ? <Link key={n.id} href={n.link}>{content}</Link> : <div key={n.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
