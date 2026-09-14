import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, MessageSenderRole } from "@/types";
import { createNotification } from "./notifications";

export async function getOrCreateConversation(
  supabase: SupabaseClient,
  params: { business_id: string; user_id: string; customer_name: string; product_id?: string; product_name?: string }
) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("business_id", params.business_id)
    .eq("user_id", params.user_id)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      business_id: params.business_id,
      user_id: params.user_id,
      customer_name: params.customer_name,
      product_id: params.product_id ?? null,
      product_name: params.product_name ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // Otra pestaña/click alcanzo a crear la conversacion primero (UNIQUE business_id+user_id).
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("business_id", params.business_id)
        .eq("user_id", params.user_id)
        .single();
      if (retry) return retry.id as string;
    }
    throw error;
  }

  return data.id as string;
}

export async function sendMessage(
  supabase: SupabaseClient,
  params: {
    conversation_id: string;
    sender_role: MessageSenderRole;
    sender_id: string;
    body: string;
    recipient_user_id: string;
    notification_title: string;
    notification_link: string;
  }
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversation_id,
      sender_role: params.sender_role,
      sender_id: params.sender_id,
      body: params.body,
    })
    .select()
    .single();

  if (error) throw error;

  const now = new Date().toISOString();
  await supabase
    .from("conversations")
    .update({
      last_message: params.body,
      last_sender_role: params.sender_role,
      last_message_at: now,
      ...(params.sender_role === "customer" ? { customer_read_at: now } : { business_read_at: now }),
    })
    .eq("id", params.conversation_id);

  await createNotification(supabase, {
    user_id: params.recipient_user_id,
    type: "new_message",
    title: params.notification_title,
    body: params.body.slice(0, 80),
    link: params.notification_link,
  });

  return data as ChatMessage;
}
