"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/messages";
import type { ChatMessage, MessageSenderRole } from "@/types";

interface Props {
  conversationId: string;
  currentRole: MessageSenderRole;
  currentUserId: string;
  recipientUserId: string;
  notificationTitle: string;
  notificationLink: string;
  initialMessages: ChatMessage[];
}

export default function ChatThread({
  conversationId,
  currentRole,
  currentUserId,
  recipientUserId,
  notificationTitle,
  notificationLink,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const readField = currentRole === "customer" ? "customer_read_at" : "business_read_at";
    supabase.from("conversations").update({ [readField]: new Date().toISOString() }).eq("id", conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const instanceId = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`conversation-${conversationId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.sender_id === currentUserId) return; // ya se agregó de forma optimista al enviar
          setMessages((prev) => [...prev, msg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      const message = await sendMessage(supabase, {
        conversation_id: conversationId,
        sender_role: currentRole,
        sender_id: currentUserId,
        body,
        recipient_user_id: recipientUserId,
        notification_title: notificationTitle,
        notification_link: notificationLink,
      });
      setMessages((prev) => [...prev, message]);
    } catch {
      toast.error("No se pudo enviar el mensaje");
      setDraft(body);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[65vh] card overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
            Todavía no hay mensajes. Escribe el primero.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === currentRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-brand-100" : "text-slate-400 dark:text-slate-500"}`}>
                    {format(new Date(m.created_at), "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-slate-100 dark:border-white/10">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="input flex-1"
        />
        <button type="submit" disabled={sending || !draft.trim()} className="btn-primary px-4 flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
