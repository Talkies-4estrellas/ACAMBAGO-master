"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadOwnedBusinesses } from "@/lib/current-business";
import ChatThread from "@/components/ui/ChatThread";
import CreateReservationModal from "@/components/ui/CreateReservationModal";
import { ChatMessage, Conversation, BusinessBranch } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function MensajeThreadPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [businessBranches, setBusinessBranches] = useState<BusinessBranch[]>([]);
  const [bankEnabled, setBankEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);

  useEffect(() => {
    if (IS_DEMO) { setLoading(false); return; }
    if (!isLoaded || !user) return;

    const supabase = createClient();
    const load = async () => {
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) { setNotFound(true); setLoading(false); return; }

      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (!conv || conv.business_id !== biz.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [{ data: msgs }, { data: branches }] = await Promise.all([
        supabase.from("messages").select("*").eq("conversation_id", params.id).order("created_at", { ascending: true }),
        supabase.from("business_branches").select("*").eq("business_id", biz.id).order("name"),
      ]);

      setConversation(conv as Conversation);
      setBusinessName(biz.name);
      setBusinessId(biz.id);
      setBusinessBranches((branches ?? []) as BusinessBranch[]);
      setBankEnabled(!!biz.bank_clabe);
      setMessages((msgs ?? []) as ChatMessage[]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, params.id]);

  if (IS_DEMO) {
    return <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Conecta Supabase para ver mensajes reales.</div>;
  }

  if (loading) {
    return <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>;
  }

  if (notFound || !conversation) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500 dark:text-slate-400">No se encontró esta conversación.</p>
        <Link href="/dashboard/business/mensajes" className="text-brand-600 dark:text-brand-400 text-sm hover:underline mt-2 inline-block">
          Volver a mensajes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/business/mensajes" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-300" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-slate-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{conversation.customer_name}</p>
          {conversation.product_name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Sobre: {conversation.product_name}</p>
          )}
        </div>
        <button
          onClick={() => setShowReservationModal(true)}
          className="text-xs px-3 py-2 rounded-xl font-medium bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors flex items-center gap-1.5 flex-shrink-0"
        >
          <Bookmark className="w-3.5 h-3.5" /> Crear apartado
        </button>
      </div>

      <ChatThread
        conversationId={conversation.id}
        currentRole="business"
        currentUserId={user!.id}
        recipientUserId={conversation.user_id}
        notificationTitle={`${businessName} te respondió un mensaje`}
        notificationLink={`/perfil/mensajes/${conversation.id}`}
        initialMessages={messages}
      />

      {showReservationModal && (
        <CreateReservationModal
          conversationId={conversation.id}
          businessId={businessId}
          businessBranches={businessBranches}
          bankEnabled={bankEnabled}
          onCreated={() => setShowReservationModal(false)}
          onClose={() => setShowReservationModal(false)}
        />
      )}
    </div>
  );
}
