"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { OrderStatusIcon, OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { Order } from "@/types";
import { getDemoMode, DEMO_BUYER_ORDERS } from "@/lib/demo-mode";

type BuyerOrder = Order & { businesses: { name: string } | null };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

function orderItemsSummary(order: BuyerOrder) {
  const items = order.order_items ?? [];
  if (items.length === 0) return "Pedido";
  if (items.length === 1) return items[0].name;
  return `${items[0].name} y ${items.length - 1} más`;
}

export default function PedidosPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const demoMode = getDemoMode();

  useEffect(() => {
    if (demoMode === "buyer" || IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    supabase
      .from("orders")
      .select("*, order_items(*), businesses(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as BuyerOrder[]);
        setLoading(false);
      });
  }, [isLoaded, user?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-500" /> Mis pedidos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Todos tus pedidos, del más reciente al más viejo</p>
      </div>

      {demoMode === "buyer" || IS_DEMO ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">Demo</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {DEMO_BUYER_ORDERS.map((o) => (
              <Link key={o.id} href={`/checkout/tracking?order=${o.id}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <OrderStatusIcon status={o.status as Order["status"]} className="w-8 h-8 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{o.item}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3" /> {o.store} · {o.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <OrderStatusBadge status={o.status as Order["status"]} className="hidden sm:inline-flex" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no has hecho ningún pedido.</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-white/10">
          {orders.map((o) => (
            <Link key={o.id} href={`/checkout/tracking?order=${o.id}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <OrderStatusIcon status={o.status} className="w-8 h-8 rounded-xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{orderItemsSummary(o)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Store className="w-3 h-3" /> {o.businesses?.name ?? "Negocio"} · {format(new Date(o.created_at), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <OrderStatusBadge status={o.status} className="hidden sm:inline-flex" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
