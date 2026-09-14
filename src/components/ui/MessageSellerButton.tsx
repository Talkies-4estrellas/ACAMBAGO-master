"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/messages";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

interface Props {
  businessId: string;
  productId?: string;
  productName?: string;
  variant?: "outline" | "solid";
}

export default function MessageSellerButton({ businessId, productId, productName, variant = "outline" }: Props) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (IS_DEMO) {
      toast("Conecta Supabase para mandar mensajes reales", { icon: "ℹ️" });
      return;
    }
    if (!isLoaded) return;
    if (!user) {
      router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const conversationId = await getOrCreateConversation(supabase, {
        business_id: businessId,
        user_id: user.id,
        customer_name: user.fullName ?? user.firstName ?? "Cliente",
        product_id: productId,
        product_name: productName,
      });
      router.push(`/perfil/mensajes/${conversationId}`);
    } catch {
      toast.error("No se pudo abrir la conversación");
      setLoading(false);
    }
  };

  const className =
    variant === "solid"
      ? "btn-secondary flex items-center gap-2 text-sm"
      : "w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-white/15 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors";

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      <MessageCircle className="w-4 h-4 text-brand-500" />
      {loading ? "Abriendo..." : "Enviar mensaje"}
    </button>
  );
}
