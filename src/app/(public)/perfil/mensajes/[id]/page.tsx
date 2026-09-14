"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ChatThread from "@/components/ui/ChatThread";
import { ChatMessage, Conversation } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

type ConversationDetail = Conversation & { businesses: { name: string; owner_id: string; image_url: string | null } | null };

export default function MensajeThreadPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    const supabase = createClient();
    const load = async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("*, businesses(name, owner_id, image_url)")
        .eq("id", params.id)
        .maybeSingle();

      if (!conv || conv.user_id !== user.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.id)
        .order("created_at", { ascending: true });

      setConversation(conv as unknown as ConversationDetail);
      setMessages((msgs ?? []) as ChatMessage[]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, params.id]);

  if (IS_DEMO) {
    return <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Conecta Supabase para ver tus mensajes reales.</div>;
  }

  if (loading) {
    return <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>;
  }

  if (notFound || !conversation) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500 dark:text-slate-400">No se encontró esta conversación.</p>
        <Link href="/perfil/mensajes" className="text-brand-600 dark:text-brand-400 text-sm hover:underline mt-2 inline-block">
          Volver a mis mensajes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/perfil/mensajes" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-300" />
        </Link>
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          {conversation.businesses?.image_url ? (
            <Image src={conversation.businesses.image_url} alt={conversation.businesses.name} width={36} height={36} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{conversation.businesses?.name ?? "Tienda"}</p>
          {conversation.product_name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Sobre: {conversation.product_name}</p>
          )}
        </div>
      </div>

      <ChatThread
        conversationId={conversation.id}
        currentRole="customer"
        currentUserId={user!.id}
        recipientUserId={conversation.businesses?.owner_id ?? ""}
        notificationTitle={`${user!.fullName ?? user!.firstName ?? "Un cliente"} te escribió un mensaje`}
        notificationLink={`/dashboard/business/mensajes/${conversation.id}`}
        initialMessages={messages}
      />
    </div>
  );
}
