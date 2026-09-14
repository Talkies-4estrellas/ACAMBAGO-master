"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Conversation } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

type ConversationRow = Conversation & { businesses: { name: string; image_url: string | null } | null };

export default function MisMensajesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    const supabase = createClient();
    supabase
      .from("conversations")
      .select("*, businesses(name, image_url)")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as unknown as ConversationRow[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-500" /> Mis mensajes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tus conversaciones con las tiendas</p>
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">
          Conecta Supabase para ver tus mensajes reales.
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no has iniciado ninguna conversación con una tienda.</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-white/10">
          {items.map((c) => {
            const unread = c.last_sender_role === "business" && (!c.customer_read_at || c.customer_read_at < c.last_message_at);
            return (
              <Link
                key={c.id}
                href={`/perfil/mensajes/${c.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  {c.businesses?.image_url ? (
                    <Image src={c.businesses.image_url} alt={c.businesses.name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${unread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-800 dark:text-slate-200"}`}>
                      {c.businesses?.name ?? "Tienda"}
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
                    {format(new Date(c.last_message_at), "dd MMM", { locale: es })}
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
