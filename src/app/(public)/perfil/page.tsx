"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Ticket, Store, ShoppingBag, Heart, Package, Settings,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPrice } from "@/lib/utils";
import { playNotificationSound } from "@/lib/notification-sound";
import { OrderStatusIcon, OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { Order, OrderStatus } from "@/types";
import {
  getDemoMode,
  DEMO_BUYER,
  DEMO_BUYER_ORDERS,
  DEMO_BUYER_FAVORITES,
  DEMO_BUYER_COUPONS,
} from "@/lib/demo-mode";

interface Redemption {
  id: string;
  redeemed_at: string;
  coupons: { title: string; value: number; discount_type: string; businesses: { name: string } };
}

type BuyerOrder = Order & { businesses: { name: string } | null };

const DEMO_MY_ORDERS = DEMO_BUYER_ORDERS;
const DEMO_FAVORITES = DEMO_BUYER_FAVORITES;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

function orderItemsSummary(order: BuyerOrder) {
  const items = order.order_items ?? [];
  if (items.length === 0) return "Pedido";
  if (items.length === 1) return items[0].name;
  return `${items[0].name} y ${items.length - 1} más`;
}

export default function MiPerfilPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const demoMode = getDemoMode();
    if (demoMode === "buyer") {
      setName(DEMO_BUYER.name);
      setLoading(false);
      return;
    }

    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    if (IS_DEMO) {
      setName(user.fullName ?? user.firstName ?? "Comprador");
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single();
      setName(profile?.name ?? user.fullName ?? user.firstName ?? "");
      setAvatarUrl(profile?.avatar_url ?? null);

      const { data: reds } = await supabase
        .from("coupon_redemptions")
        .select("id, redeemed_at, coupons(title, value, discount_type, businesses(name))")
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false })
        .limit(3);
      setRedemptions((reds ?? []) as unknown as Redemption[]);

      const { data: myOrders, count } = await supabase
        .from("orders")
        .select("*, order_items(*), businesses(name)", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setOrders((myOrders ?? []) as unknown as BuyerOrder[]);
      setOrdersCount(count ?? 0);

      const { count: favCount } = await supabase
        .from("business_favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setFavoritesCount(favCount ?? 0);

      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  // Notificación en vivo: si el vendedor cambia el estado de un pedido, avisa sin recargar.
  useEffect(() => {
    if (IS_DEMO || !user) return;
    const channel = supabase
      .channel(`buyer-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
          playNotificationSound();
          toast.success(`Tu pedido cambió a "${updated.status.replace("_", " ")}"`, { icon: "📦" });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (loading || (!getDemoMode() && !isLoaded)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const demoMode = getDemoMode();
  const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="card p-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden flex-shrink-0 relative">
          {avatarUrl ? <Image src={avatarUrl} alt={name || "Mi foto"} fill className="object-cover" /> : initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">Hola, {name || "de nuevo"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Este es el resumen de tu cuenta</p>
        </div>
        <Link href="/perfil/configuracion" className="flex-shrink-0 p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" title="Configuración">
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: ShoppingBag, label: "Pedidos",   value: demoMode ? DEMO_MY_ORDERS.length : (IS_DEMO ? DEMO_MY_ORDERS.length : ordersCount), color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-500/10", href: "/perfil/pedidos" },
          { icon: Heart,       label: "Favoritos", value: demoMode ? DEMO_FAVORITES.length : (IS_DEMO ? DEMO_FAVORITES.length : favoritesCount), color: "text-red-500 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-500/10", href: "/perfil/favoritos" },
          { icon: Ticket,      label: "Cupones",   value: demoMode ? DEMO_BUYER_COUPONS.length : (IS_DEMO ? 2 : redemptions.length), color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", href: "/perfil/cupones" },
        ].map(({ icon: Icon, label, value, color, bg, href }) => (
          <Link key={label} href={href} className="card p-4 text-center hover:shadow-md transition-shadow">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* My orders (preview) */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-500" /> Mis pedidos
          </h2>
          <Link href="/perfil/pedidos" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">Ver todos</Link>
        </div>
        {demoMode || IS_DEMO ? (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {DEMO_MY_ORDERS.slice(0, 3).map((o) => (
              <Link key={o.id} href={`/checkout/tracking?order=${o.id}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <OrderStatusIcon status={o.status as OrderStatus} className="w-8 h-8 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{o.item}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3" /> {o.store} · {o.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <OrderStatusBadge status={o.status as OrderStatus} className="hidden sm:inline-flex" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Todavía no has hecho ningún pedido.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {orders.map((o) => (
              <Link key={o.id} href={`/checkout/tracking?order=${o.id}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <OrderStatusIcon status={o.status} className="w-8 h-8 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{orderItemsSummary(o)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3" /> {o.businesses?.name ?? "Negocio"} · {format(new Date(o.created_at), "dd MMM", { locale: es })}
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
    </div>
  );
}
