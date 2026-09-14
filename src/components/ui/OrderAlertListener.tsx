"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { playNotificationSound } from "@/lib/notification-sound";
import { formatPrice } from "@/lib/utils";
import { Order } from "@/types";
import toast from "react-hot-toast";

// Vive en dashboard/layout.tsx (no en orders/page.tsx) para que el
// vendedor se entere de un pedido nuevo con sonido + toast sin importar
// en que pagina del panel este, no solo cuando tiene abierta "Pedidos".
export default function OrderAlertListener({ businessId }: { businessId: string }) {
  useEffect(() => {
    const supabase = createClient();
    const instanceId = Math.random().toString(36).slice(2);

    const channel = supabase
      .channel(`orders-alert-${businessId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `business_id=eq.${businessId}` },
        (payload) => {
          const order = payload.new as Order;
          playNotificationSound();
          toast.success(`Pedido nuevo de ${order.customer_name} · ${formatPrice(order.total)}`, { duration: 6000, icon: "🔔" });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  return null;
}
