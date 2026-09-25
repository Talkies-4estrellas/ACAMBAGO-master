"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Phone, Check, Truck, Clock, Store, MessageSquare, User, X, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Reservation, ReservationStatus, BusinessBranch } from "@/types";
import { ReservationStatusIcon, ReservationStatusBadge } from "@/components/ui/ReservationStatusBadge";
import { loadOwnedBusinesses } from "@/lib/current-business";
import toast from "react-hot-toast";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "reservado", label: "Reservados" },
  { key: "en_proceso", label: "En proceso" },
  { key: "entregado", label: "Entregados" },
  { key: "cancelado", label: "Cancelados" },
] as const;

type Tab = typeof TABS[number]["key"];

const PAYMENT_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  in_person: "En persona",
};

export default function ReservationsPage() {
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState<Tab>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [branches, setBranches] = useState<BusinessBranch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const businessIdRef = useRef<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      if (IS_DEMO) { setLoaded(true); return; }
      if (!isLoaded || !user) return;

      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) { setLoaded(true); return; }
      businessIdRef.current = biz.id;

      const [{ data }, { data: branchesData }] = await Promise.all([
        supabase.from("reservations").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
        supabase.from("business_branches").select("*").eq("business_id", biz.id).order("name"),
      ]);

      setReservations((data ?? []) as Reservation[]);
      setBranches((branchesData ?? []) as BusinessBranch[]);
      setLoaded(true);
    };
    load();
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (IS_DEMO || !businessIdRef.current) return;
    const bizId = businessIdRef.current;
    const instanceId = Math.random().toString(36).slice(2);

    const channel = supabase
      .channel(`reservations-list-${bizId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations", filter: `business_id=eq.${bizId}` },
        (payload) => setReservations((prev) => [payload.new as Reservation, ...prev])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations", filter: `business_id=eq.${bizId}` },
        (payload) => {
          const updated = payload.new as Reservation;
          setReservations((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loaded]);

  const branchName = (branchId?: string) => {
    if (!branchId) return "Sucursal principal";
    return branches.find((b) => b.id === branchId)?.name ?? "Sucursal principal";
  };

  const updateStatus = async (reservation: Reservation, status: ReservationStatus) => {
    if (IS_DEMO) { toast("Conecta Supabase para gestionar apartados reales", { icon: "ℹ️" }); return; }
    const res = await fetch("/api/reservations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: reservation.id, status }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "No se pudo actualizar el apartado"); return; }
    setReservations((prev) => prev.map((r) => (r.id === reservation.id ? { ...r, status } : r)));
    toast.success("Apartado actualizado");
  };

  const markPayment = async (reservation: Reservation, which: "deposit" | "balance") => {
    if (IS_DEMO) { toast("Conecta Supabase para gestionar apartados reales", { icon: "ℹ️" }); return; }
    const res = await fetch("/api/reservations/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: reservation.id, which }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "No se pudo actualizar el pago"); return; }
    const now = new Date().toISOString();
    setReservations((prev) => prev.map((r) => (r.id === reservation.id ? { ...r, [which === "deposit" ? "deposit_paid_at" : "balance_paid_at"]: now } : r)));
    toast.success("Pago registrado");
  };

  const filtered = reservations.filter((r) => {
    if (tab === "todos") return true;
    if (tab === "en_proceso") return r.status === "listo_en_sucursal" || r.status === "enviado_a_domicilio";
    return r.status === tab;
  });

  const counts = {
    todos: reservations.length,
    reservado: reservations.filter((r) => r.status === "reservado").length,
    en_proceso: reservations.filter((r) => r.status === "listo_en_sucursal" || r.status === "enviado_a_domicilio").length,
    entregado: reservations.filter((r) => r.status === "entregado").length,
    cancelado: reservations.filter((r) => r.status === "cancelado").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-brand-500" /> Apartados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Productos reservados con anticipo, pendientes de entregar</p>
        </div>
      </div>

      {IS_DEMO && (
        <div className="card p-4 flex items-start gap-3 border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/5">
          <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">Conecta Supabase para ver y gestionar apartados reales.</p>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === key ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300" : "bg-slate-200 dark:bg-white/10"}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!loaded ? (
          <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando apartados...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No se encontraron apartados</p>
          </div>
        ) : (
          filtered.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <ReservationStatusIcon status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{r.customer_name}</p>
                      <span className="text-xs text-slate-400">#{r.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {r.item_name} x{r.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <ReservationStatusBadge status={r.status} className="hidden sm:inline-flex" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(r.total_amount)}</span>
                    <span className={`text-slate-300 dark:text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-white/10 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Cliente</p>
                        <p className="text-slate-700 dark:text-slate-300">{r.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</p>
                        <p className="text-slate-700 dark:text-slate-300">{r.customer_phone || "No proporcionado"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                          {r.delivery_method === "home" ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          Entrega
                        </p>
                        {r.delivery_method === "pickup_branch" ? (
                          <p className="text-slate-700 dark:text-slate-300">Recoge en: {branchName(r.branch_id)}</p>
                        ) : (
                          <p className="text-slate-700 dark:text-slate-300">
                            A domicilio: {[r.address?.street, r.address?.colonia].filter(Boolean).join(", ") || "Sin dirección"}
                          </p>
                        )}
                      </div>
                      {r.item_description && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Descripción</p>
                          <p className="text-slate-700 dark:text-slate-300 italic">&ldquo;{r.item_description}&rdquo;</p>
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-400 mb-0.5">Montos</p>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Total</span><span className="text-slate-700 dark:text-slate-300">{formatPrice(r.total_amount)}</span></div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Anticipo ({PAYMENT_LABELS[r.payment_method]})</span>
                            <span className={r.deposit_paid_at ? "text-green-600 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}>
                              {formatPrice(r.deposit_amount)} {r.deposit_paid_at ? "· recibido" : "· pendiente"}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold text-sm text-slate-800 dark:text-white pt-1 border-t border-slate-100 dark:border-white/10">
                            <span>Saldo restante</span>
                            <span className={r.balance_paid_at ? "text-green-600 dark:text-green-400" : ""}>
                              {formatPrice(r.remaining_amount)} {r.balance_paid_at ? "· recibido" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {r.customer_phone && (
                        <a
                          href={`https://wa.me/52${r.customer_phone.replace(/\D/g, "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {r.conversation_id && (
                        <a
                          href={`/dashboard/business/mensajes/${r.conversation_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Ver chat
                        </a>
                      )}
                      {r.status === "reservado" && r.delivery_method === "pickup_branch" && (
                        <button onClick={() => updateStatus(r, "listo_en_sucursal")} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                          <Store className="w-3.5 h-3.5" /> Marcar listo en sucursal
                        </button>
                      )}
                      {r.status === "reservado" && r.delivery_method === "home" && (
                        <button onClick={() => updateStatus(r, "enviado_a_domicilio")} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                          <Truck className="w-3.5 h-3.5" /> Marcar enviado a domicilio
                        </button>
                      )}
                      {(r.status === "listo_en_sucursal" || r.status === "enviado_a_domicilio") && (
                        <button onClick={() => updateStatus(r, "entregado")} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Marcar entregado
                        </button>
                      )}
                      {!r.deposit_paid_at && (r.status === "reservado" || r.status === "listo_en_sucursal" || r.status === "enviado_a_domicilio") && (
                        <button onClick={() => markPayment(r, "deposit")} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                          <Wallet className="w-3.5 h-3.5" /> Marcar anticipo recibido
                        </button>
                      )}
                      {!r.balance_paid_at && (r.status === "listo_en_sucursal" || r.status === "enviado_a_domicilio" || r.status === "entregado") && (
                        <button onClick={() => markPayment(r, "balance")} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                          <Wallet className="w-3.5 h-3.5" /> Marcar saldo recibido
                        </button>
                      )}
                      {(r.status === "reservado" || r.status === "listo_en_sucursal" || r.status === "enviado_a_domicilio") && (
                        <button
                          onClick={() => { if (confirm("¿Seguro que quieres cancelar este apartado? Esto le avisará al cliente.")) updateStatus(r, "cancelado"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar apartado
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
