"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bookmark, Store, Truck, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { ReservationStatusIcon, ReservationStatusBadge } from "@/components/ui/ReservationStatusBadge";
import { Reservation } from "@/types";
import toast from "react-hot-toast";

type BuyerReservation = Reservation & { businesses: { name: string } | null };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default function ApartadosPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<BuyerReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    supabase
      .from("reservations")
      .select("*, businesses(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReservations((data ?? []) as unknown as BuyerReservation[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  // Se mantiene al dia mientras se ve esta lista, mismo patron que
  // perfil/pedidos - el vendedor cambia el estado o marca un pago desde su
  // panel, o el mismo apartado esta abierto en otra pestana.
  useEffect(() => {
    if (IS_DEMO || !user) return;
    const instanceId = Math.random().toString(36).slice(2);

    const channel = supabase
      .channel(`buyer-reservations-${user.id}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Reservation;
          setReservations((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const cancelReservation = async (id: string) => {
    if (!confirm("¿Seguro que quieres cancelar este apartado?")) return;
    const res = await fetch("/api/reservations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: id, status: "cancelado" }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "No se pudo cancelar el apartado"); return; }
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelado" } : r)));
    toast.success("Apartado cancelado");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-brand-500" /> Mis apartados
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Productos que reservaste con un anticipo</p>
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Conecta Supabase para ver apartados reales.</div>
      ) : loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando apartados...</div>
      ) : reservations.length === 0 ? (
        <div className="card p-10 text-center">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no has apartado ningún producto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <ReservationStatusIcon status={r.status} className="w-9 h-9 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.item_name} x{r.quantity}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3" /> {r.businesses?.name ?? "Negocio"} · {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <ReservationStatusBadge status={r.status} />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(r.total_amount)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {r.delivery_method === "home" ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                    {r.delivery_method === "home" ? "A domicilio" : "Recoger en sucursal"}
                  </span>
                  <span>{r.payment_method === "transfer" ? "Transferencia" : "En persona"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Anticipo</span>
                  <span className={r.deposit_paid_at ? "text-green-600 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}>
                    {formatPrice(r.deposit_amount)} {r.deposit_paid_at ? "· pagado" : "· pendiente"}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800 dark:text-white">
                  <span>Saldo restante</span>
                  <span>{formatPrice(r.remaining_amount)} {r.balance_paid_at ? "· pagado" : ""}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {r.conversation_id && (
                  <Link
                    href={`/perfil/mensajes/${r.conversation_id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Ir al chat
                  </Link>
                )}
                {r.status === "reservado" && (
                  <button
                    onClick={() => cancelReservation(r.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancelar apartado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
