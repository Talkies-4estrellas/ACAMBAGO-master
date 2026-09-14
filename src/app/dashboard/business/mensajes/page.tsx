"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadOwnedBusinesses } from "@/lib/current-business";
import { Conversation } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function MensajesPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (IS_DEMO) { setLoaded(true); return; }
      if (!isLoaded || !user) return;
      const supabase = createClient();
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) { setLoaded(true); return; }
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("business_id", biz.id)
        .order("last_message_at", { ascending: false });
      setItems((data ?? []) as Conversation[]);
      setLoaded(true);
    };
    load();
  }, [isLoaded, user?.id]);

  const unreadCount = items.filter(
    (c) => c.last_sender_role === "customer" && (!c.business_read_at || c.business_read_at < c.last_message_at)
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-brand-600" /> Mensajes
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{unreadCount} sin leer</p>
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-gray-400 dark:text-slate-500">Conecta Supabase para ver mensajes reales.</div>
      ) : !loaded ? (
        <div className="card p-10 text-center text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">Todavía no tienes mensajes de clientes.</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-white/10">
          {items.map((c) => {
            const unread = c.last_sender_role === "customer" && (!c.business_read_at || c.business_read_at < c.last_message_at);
            return (
              <Link
                key={c.id}
                href={`/dashboard/business/mensajes/${c.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${unread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-800 dark:text-slate-200"}`}>
                      {c.customer_name}
                    </p>
                    {c.product_name && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate">· {c.product_name}</span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                    {c.last_message || "Conversación iniciada"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {format(new Date(c.last_message_at), "dd MMM, HH:mm", { locale: es })}
                  </span>
                  {unread && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
