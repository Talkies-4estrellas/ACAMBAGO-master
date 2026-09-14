"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft, ChevronRight, MapPin, Clock, Package, CreditCard,
  Banknote, Truck, Store, CheckCircle2, Plus, Minus, Trash2,
  MessageSquare, Star, Phone, Copy, AlertCircle, Wallet, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import type { DeliveryMethod, PaymentMethod, Address } from "@/types";
import {
  DEMO_CHECKOUT_BUSINESS,
  DEMO_MEETING_POINTS,
  DEMO_BANK_DETAILS,
} from "@/lib/demo-mode";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface HomeAddress {
  street: string;
  references: string;
  zip: string;
  colonia: string;
  city: string;
  phone: string;
  [key: string]: string;
}

interface CardData {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  [key: string]: string;
}

interface PickupBusiness {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  bank_name: string | null;
  bank_holder: string | null;
  bank_clabe: string | null;
  mp_public_key: string | null;
  stripe_charges_enabled: boolean;
  pickup_enabled: boolean;
  meeting_enabled: boolean;
  home_enabled: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Resumen" },
  { n: 2, label: "Entrega" },
  { n: 3, label: "Pago" },
  { n: 4, label: "Confirmación" },
];

const SHIPPING_COST = DEMO_CHECKOUT_BUSINESS.deliveryCost;

// ── Progress Bar ───────────────────────────────────────────────────────────

function CheckoutProgress({ step }: { step: Step }) {
  if (step === 5) return null;
  return (
    <div className="px-4 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#060e18]">
      <div className="max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      done
                        ? "bg-brand-500 text-white"
                        : active
                        ? "bg-brand-500 text-white ring-4 ring-brand-200 dark:ring-brand-500/30"
                        : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-gray-500"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-5 transition-all duration-500 ${
                      done ? "bg-brand-500" : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Order Summary ─────────────────────────────────────────────────

function Step1({
  note,
  setNote,
  contactPhone,
  setContactPhone,
  onNext,
  shippingMethod,
}: {
  note: string;
  setNote: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  onNext: () => void;
  shippingMethod: DeliveryMethod;
}) {
  const { items, updateQty, removeItem, total } = useCart();
  const shipping = shippingMethod === "home" ? SHIPPING_COST : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-slate-800 dark:text-white text-sm">
            {items.length} {items.length === 1 ? "producto" : "productos"}
          </span>
          {IS_DEMO && (
            <span className="ml-auto text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {DEMO_CHECKOUT_BUSINESS.prepTime}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                  {formatPrice(item.price)} c/u
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                >
                  <Minus className="w-3 h-3 text-slate-600 dark:text-gray-300" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="w-16 text-right text-sm font-semibold text-slate-700 dark:text-gray-200">
                {formatPrice(item.price * item.quantity)}
              </p>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contact phone */}
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
          <Phone className="w-4 h-4 text-slate-400" />
          Teléfono de contacto
        </label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Para avisarte sobre tu pedido"
          className="w-full text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500"
        />
      </div>

      {/* Note */}
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          Notas para la tienda
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: talla, color, empaque especial, instrucciones de entrega..."
          rows={2}
          className="w-full text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 resize-none"
        />
      </div>

      {/* Totals */}
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400">
          <span>Envío</span>
          <span className={shipping === 0 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
            {shipping === 0 ? "Gratis" : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
          <span>Descuento demo</span>
          <span>-{formatPrice(0)}</span>
        </div>
        <div className="border-t border-slate-100 dark:border-white/10 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
          <span>Total</span>
          <span className="text-brand-600 dark:text-brand-400 text-lg">{formatPrice(total + shipping)}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={items.length === 0}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-brand-500/20"
      >
        Continuar
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ── Step 2: Delivery ──────────────────────────────────────────────────────

function Step2({
  method,
  setMethod,
  meetingPoint,
  setMeetingPoint,
  address,
  setAddress,
  onNext,
  pickupBusinesses,
}: {
  method: DeliveryMethod;
  setMethod: (v: DeliveryMethod) => void;
  meetingPoint: string;
  setMeetingPoint: (v: string) => void;
  address: HomeAddress;
  setAddress: (v: HomeAddress) => void;
  onNext: () => void;
  pickupBusinesses: PickupBusiness[];
}) {
  const { user } = useUser();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [saveForNext, setSaveForNext] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (IS_DEMO || !user || method !== "home") return;
    const supabase = createClient();
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as Address[];
        setSavedAddresses(rows);
        const preferred = rows.find((a) => a.is_default) ?? rows[0];
        if (preferred) {
          setSelectedId(preferred.id);
          setAddress({ street: preferred.street, references: preferred.notes ?? "", zip: preferred.zip ?? "", colonia: preferred.colonia ?? "", city: preferred.city, phone: preferred.phone });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, method]);

  const pickSaved = (addr: Address) => {
    setSelectedId(addr.id);
    setAddress({ street: addr.street, references: addr.notes ?? "", zip: addr.zip ?? "", colonia: addr.colonia ?? "", city: addr.city, phone: addr.phone });
  };

  const pickNew = () => {
    setSelectedId("new");
    setAddress({ street: "", references: "", zip: "", colonia: "", city: "Acámbaro, Gto.", phone: "" });
  };

  const isEnabled = (key: "pickup_enabled" | "meeting_enabled" | "home_enabled") =>
    IS_DEMO || pickupBusinesses.length === 0 || pickupBusinesses.every((b) => b[key] !== false);

  const deliveryOptions = [
    { id: "pickup", icon: Store, label: "Recoger", sub: "En tienda", available: isEnabled("pickup_enabled") },
    { id: "meeting", icon: MapPin, label: "Punto", sub: "De reunión", available: isEnabled("meeting_enabled") },
    { id: "home", icon: Truck, label: "Domicilio", sub: `+${formatPrice(SHIPPING_COST)}`, available: isEnabled("home_enabled") },
  ].filter((opt) => opt.available);

  useEffect(() => {
    if (!deliveryOptions.some((opt) => opt.id === method) && deliveryOptions.length > 0) {
      setMethod(deliveryOptions[0].id as DeliveryMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupBusinesses]);

  const canContinue =
    method === "pickup" ||
    (method === "meeting" && meetingPoint !== "") ||
    (method === "home" && address.street !== "" && address.phone !== "");

  const handleContinue = async () => {
    if (method === "home" && selectedId === "new" && saveForNext && user && !IS_DEMO) {
      setSavingAddress(true);
      const supabase = createClient();
      await supabase.from("addresses").insert({
        user_id: user.id,
        label: "Casa",
        street: address.street,
        notes: address.references || null,
        colonia: address.colonia || null,
        zip: address.zip || null,
        city: address.city,
        phone: address.phone,
        is_default: savedAddresses.length === 0,
      });
      setSavingAddress(false);
    }
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div className={`grid gap-2 ${deliveryOptions.length === 3 ? "grid-cols-3" : deliveryOptions.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {deliveryOptions.map(({ id, icon: Icon, label, sub }) => (
          <button
            key={id}
            onClick={() => setMethod(id as DeliveryMethod)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${
              method === id
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a1628] hover:border-slate-300"
            }`}
          >
            <Icon className={`w-5 h-5 ${method === id ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
            <span className={`text-xs font-bold ${method === id ? "text-brand-700 dark:text-brand-300" : "text-slate-600 dark:text-gray-400"}`}>
              {label}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-gray-500">{sub}</span>
          </button>
        ))}
      </div>

      {/* Pickup */}
      {method === "pickup" && (
        <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
          {IS_DEMO ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{DEMO_CHECKOUT_BUSINESS.name}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{DEMO_CHECKOUT_BUSINESS.address}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {DEMO_CHECKOUT_BUSINESS.hours}
                </p>
              </div>
            </div>
          ) : pickupBusinesses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">Recogerás tu pedido directamente en la tienda.</p>
          ) : pickupBusinesses.length === 1 ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{pickupBusinesses[0].name}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{pickupBusinesses[0].address}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-gray-400">Tu pedido incluye productos de {pickupBusinesses.length} tiendas distintas, recógelos en cada una:</p>
              {pickupBusinesses.map((b) => (
                <div key={b.id} className="flex items-start gap-3">
                  <Store className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{b.name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{b.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!IS_DEMO && pickupBusinesses.length === 1 && pickupBusinesses[0].latitude != null && pickupBusinesses[0].longitude != null && (
            <a
              href={`https://www.google.com/maps?q=${pickupBusinesses[0].latitude},${pickupBusinesses[0].longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Ver en Google Maps
            </a>
          )}
          {IS_DEMO && (
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Ver en Google Maps (demo)
            </a>
          )}
        </div>
      )}

      {/* Meeting points */}
      {method === "meeting" && (
        <div className="space-y-2">
          {DEMO_MEETING_POINTS.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setMeetingPoint(pt.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left ${
                meetingPoint === pt.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a1628] hover:border-slate-300"
              }`}
            >
              <span className="text-2xl">{pt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{pt.name}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{pt.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Home delivery */}
      {method === "home" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2.5 bg-brand-50 dark:bg-brand-500/10 rounded-xl border border-brand-200 dark:border-brand-500/20">
            <Truck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs text-brand-700 dark:text-brand-300">
              Costo de envío: <strong>{formatPrice(SHIPPING_COST)}</strong> · Tiempo estimado: <strong>30-45 min</strong>
            </span>
          </div>

          {/* Direcciones guardadas */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => pickSaved(addr)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    selectedId === addr.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a1628] hover:border-slate-300"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{addr.label}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{addr.street}{addr.colonia ? `, ${addr.colonia}` : ""}</p>
                  </div>
                  {selectedId === addr.id && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />}
                </button>
              ))}
              <button
                onClick={pickNew}
                className={`w-full flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed transition-all duration-200 text-sm font-medium ${
                  selectedId === "new"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-slate-300"
                }`}
              >
                <Plus className="w-4 h-4" /> Usar otra dirección
              </button>
            </div>
          )}

          {/* Formulario manual */}
          {selectedId === "new" && (
            <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
              {[
                { key: "street", label: "Calle y número", placeholder: "Ej: Av. Juárez 123" },
                { key: "references", label: "Referencias", placeholder: "Ej: Casa azul, frente a la escuela" },
                { key: "colonia", label: "Colonia", placeholder: "Ej: Centro" },
                { key: "zip", label: "Código postal", placeholder: "Ej: 38400" },
                { key: "city", label: "Ciudad", placeholder: "Acámbaro, Gto." },
                { key: "phone", label: "Teléfono de contacto", placeholder: "418 123 4567" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 block">{label}</label>
                  <input
                    type={key === "phone" || key === "zip" ? "tel" : "text"}
                    placeholder={placeholder}
                    value={(address as Record<string, string>)[key]}
                    onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                    className="w-full text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500"
                  />
                </div>
              ))}
              {!IS_DEMO && user && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400 pt-1">
                  <input type="checkbox" checked={saveForNext} onChange={(e) => setSaveForNext(e.target.checked)} className="rounded" />
                  Guardar esta dirección para la próxima vez
                </label>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue || savingAddress}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-brand-500/20"
      >
        {savingAddress ? "Guardando dirección..." : "Continuar"}
        {!savingAddress && <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  );
}

// ── Step 3: Payment ───────────────────────────────────────────────────────

function Step3({
  method,
  setMethod,
  cashAmount,
  setCashAmount,
  card,
  setCard,
  total,
  onNext,
  pickupBusinesses,
}: {
  method: PaymentMethod;
  setMethod: (v: PaymentMethod) => void;
  cashAmount: string;
  setCashAmount: (v: string) => void;
  card: CardData;
  setCard: (v: CardData) => void;
  total: number;
  onNext: () => void;
  pickupBusinesses: PickupBusiness[];
}) {
  const cashNum = parseFloat(cashAmount) || 0;
  const change = cashNum > total ? cashNum - total : 0;
  const [copied, setCopied] = useState<string | null>(null);
  const businessesWithBank = pickupBusinesses.filter((b) => b.bank_clabe);
  const transferAvailable = IS_DEMO || businessesWithBank.length > 0;
  const mercadoPagoAvailable = !IS_DEMO && pickupBusinesses.length > 0 && pickupBusinesses.every((b) => b.mp_public_key);
  const stripeAvailable = !IS_DEMO && pickupBusinesses.length > 0 && pickupBusinesses.every((b) => b.stripe_charges_enabled);

  const copyClabe = (clabe: string) => {
    navigator.clipboard.writeText(clabe).catch(() => {});
    setCopied(clabe);
    setTimeout(() => setCopied(null), 2000);
  };

  const canContinue =
    method === "cash" ||
    method === "cod" ||
    method === "transfer" ||
    method === "mercadopago" ||
    method === "stripe" ||
    (method === "card" && card.name && card.number.length >= 16 && card.expiry && card.cvv.length >= 3);

  return (
    <div className="space-y-4">
      {/* Payment method cards */}
      {[
        { id: "cash", icon: Banknote, label: "Efectivo", sub: "Pago al recibir" },
        ...(IS_DEMO ? [{ id: "card", icon: CreditCard, label: "Tarjeta", sub: "Crédito o débito (demo)" }] : []),
        ...(transferAvailable ? [{ id: "transfer", icon: Star, label: "Transferencia", sub: "SPEI / CLABE" }] : []),
        ...(mercadoPagoAvailable ? [{ id: "mercadopago", icon: Wallet, label: "Mercado Pago", sub: "Tarjeta, OXXO, SPEI" }] : []),
        ...(stripeAvailable ? [{ id: "stripe", icon: CreditCard, label: "Tarjeta", sub: "Pago seguro con Stripe" }] : []),
        { id: "cod", icon: Package, label: "Contra entrega", sub: "Pagas al recibir" },
      ].map(({ id, icon: Icon, label, sub }) => (
        <button
          key={id}
          onClick={() => setMethod(id as PaymentMethod)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
            method === id
              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
              : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a1628] hover:border-slate-300"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === id ? "bg-brand-100 dark:bg-brand-500/20" : "bg-slate-100 dark:bg-white/10"}`}>
            <Icon className={`w-5 h-5 ${method === id ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
          </div>
          <div className="text-left flex-1">
            <p className={`text-sm font-semibold ${method === id ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-gray-300"}`}>{label}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500">{sub}</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === id ? "border-brand-500" : "border-slate-300 dark:border-white/20"}`}>
            {method === id && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
          </div>
        </button>
      ))}

      {/* Cash detail */}
      {method === "cash" && (
        <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">¿Con cuánto pagarás? (opcional)</label>
          <input
            type="number"
            placeholder={`Mínimo ${formatPrice(total)}`}
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            className="w-full text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {change > 0 && (
            <div className="flex justify-between items-center p-2.5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
              <span className="text-sm text-green-700 dark:text-green-400">Cambio estimado</span>
              <span className="font-bold text-green-700 dark:text-green-300">{formatPrice(change)}</span>
            </div>
          )}
        </div>
      )}

      {/* Card form (demo only) */}
      {method === "card" && IS_DEMO && (
        <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-300">Modo Demo: no se procesará ningún cargo real.</span>
          </div>
          {[
            { key: "name", label: "Nombre en la tarjeta", placeholder: "Carlos Mendoza" },
            { key: "number", label: "Número de tarjeta", placeholder: "1234 5678 9012 3456", maxLen: 19 },
            { key: "expiry", label: "Fecha de vencimiento", placeholder: "MM/AA" },
            { key: "cvv", label: "CVV", placeholder: "123" },
          ].map(({ key, label, placeholder, maxLen }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 block">{label}</label>
              <input
                type={key === "cvv" || key === "number" ? "tel" : "text"}
                placeholder={placeholder}
                maxLength={maxLen}
                value={(card as Record<string, string>)[key]}
                onChange={(e) => {
                  let v = e.target.value;
                  if (key === "number") v = v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
                  if (key === "expiry") {
                    v = v.replace(/\D/g, "").slice(0, 4);
                    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                  }
                  setCard({ ...card, [key]: v });
                }}
                className="w-full text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* Transfer details */}
      {method === "transfer" && IS_DEMO && (
        <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">Datos bancarios (demo)</p>
          {[
            { label: "Banco", value: DEMO_BANK_DETAILS.bank },
            { label: "Titular", value: DEMO_BANK_DETAILS.holder },
            { label: "Cuenta", value: DEMO_BANK_DETAILS.account },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-slate-800 dark:text-white">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">CLABE interbancaria</p>
              <p className="text-sm font-mono font-semibold text-slate-800 dark:text-white">{DEMO_BANK_DETAILS.clabe}</p>
            </div>
            <button onClick={() => copyClabe(DEMO_BANK_DETAILS.clabe)} className="p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied === DEMO_BANK_DETAILS.clabe && <p className="text-xs text-center text-green-600 dark:text-green-400">¡CLABE copiada!</p>}
        </div>
      )}

      {method === "transfer" && !IS_DEMO && (
        <div className="space-y-3">
          {businessesWithBank.map((b) => (
            <div key={b.id} className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">{b.name}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-gray-400">Banco</span>
                <span className="font-medium text-slate-800 dark:text-white">{b.bank_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-gray-400">Titular</span>
                <span className="font-medium text-slate-800 dark:text-white">{b.bank_holder}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">CLABE interbancaria</p>
                  <p className="text-sm font-mono font-semibold text-slate-800 dark:text-white">{b.bank_clabe}</p>
                </div>
                <button onClick={() => copyClabe(b.bank_clabe!)} className="p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === b.bank_clabe && <p className="text-xs text-center text-green-600 dark:text-green-400">¡CLABE copiada!</p>}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-brand-500/20"
      >
        Continuar
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ── Step 4: Confirmation ─────────────────────────────────────────────────

function Step4({
  delivery,
  meetingPoint,
  address,
  payment,
  cashAmount,
  note,
  total,
  onConfirm,
  confirming,
  pickupBusinesses,
}: {
  delivery: DeliveryMethod;
  meetingPoint: string;
  address: HomeAddress;
  payment: PaymentMethod;
  cashAmount: string;
  note: string;
  total: number;
  onConfirm: () => void;
  confirming: boolean;
  pickupBusinesses: PickupBusiness[];
}) {
  const { items } = useCart();
  const shipping = delivery === "home" ? SHIPPING_COST : 0;
  const mp = DEMO_MEETING_POINTS.find((p) => p.id === meetingPoint);

  const deliveryLabel =
    delivery === "pickup"
      ? IS_DEMO
        ? `Recoger en ${DEMO_CHECKOUT_BUSINESS.name}`
        : `Recoger en ${pickupBusinesses.map((b) => b.name).join(", ") || "la tienda"}`
      : delivery === "meeting"
      ? `Punto de reunión: ${mp?.name ?? ""}`
      : `Envío a domicilio: ${address.street}, ${address.colonia}`;

  const paymentLabel =
    payment === "cash" ? "Efectivo" :
    payment === "card" ? "Tarjeta de crédito/débito" :
    payment === "transfer" ? "Transferencia bancaria" :
    payment === "mercadopago" ? "Mercado Pago" :
    payment === "stripe" ? "Tarjeta (Stripe)" :
    "Pago contra entrega";

  const etaLabel = IS_DEMO
    ? delivery === "pickup" ? DEMO_CHECKOUT_BUSINESS.prepTime
      : delivery === "meeting" ? (mp ? mp.time : "15 min")
      : "30-45 min"
    : null;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">Productos</p>
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">{item.name} x{item.quantity}</span>
                <span className="font-semibold text-slate-800 dark:text-white">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-white/10 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">Entrega</p>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
            <span className="text-slate-700 dark:text-gray-300">{deliveryLabel}</span>
          </div>
          {etaLabel && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span className="text-slate-700 dark:text-gray-300">Tiempo estimado: <strong>{etaLabel}</strong></span>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-white/10 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">Pago</p>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <span className="text-slate-700 dark:text-gray-300">{paymentLabel}</span>
          </div>
          {payment === "cash" && cashAmount && (
            <div className="text-xs text-slate-500 dark:text-gray-400 pl-6">
              Pagarás con: {formatPrice(parseFloat(cashAmount))} · Cambio: {formatPrice(Math.max(0, parseFloat(cashAmount) - total - shipping))}
            </div>
          )}
        </div>

        {note && (
          <div className="p-4 border-b border-slate-100 dark:border-white/10 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">Notas</p>
            <p className="text-sm text-slate-600 dark:text-gray-400 italic">&ldquo;{note}&rdquo;</p>
          </div>
        )}

        <div className="p-4 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
            <span>Subtotal</span><span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
            <span>Envío</span><span>{shipping === 0 ? "Gratis" : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100 dark:border-white/10">
            <span className="text-slate-900 dark:text-white">Total</span>
            <span className="text-brand-600 dark:text-brand-400">{formatPrice(total + shipping)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={confirming}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-xl shadow-brand-500/30 active:scale-[0.98]"
      >
        {confirming ? (
          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {payment === "mercadopago" ? "Redirigiendo a Mercado Pago..." : payment === "stripe" ? "Redirigiendo a Stripe..." : "Confirmando..."}</>
        ) : payment === "mercadopago" ? (
          <>Ir a pagar con Mercado Pago <CheckCircle2 className="w-5 h-5" /></>
        ) : payment === "stripe" ? (
          <>Ir a pagar con tarjeta <CheckCircle2 className="w-5 h-5" /></>
        ) : (
          <>Confirmar Pedido <CheckCircle2 className="w-5 h-5" /></>
        )}
      </button>

      <p className="text-center text-xs text-slate-400 dark:text-gray-500">
        {IS_DEMO
          ? "Al confirmar aceptas los términos de la tienda. Modo Demo: ningún cargo real."
          : payment === "mercadopago"
          ? "Al confirmar, tu pedido se guarda y te llevamos a Mercado Pago para completar el cobro real."
          : payment === "stripe"
          ? "Al confirmar, tu pedido se guarda y te llevamos a Stripe para completar el cobro real con tarjeta."
          : "Al confirmar, tu pedido se enviará a la tienda."}
      </p>
    </div>
  );
}

// ── Step 5: Success ───────────────────────────────────────────────────────

function Step5({ orderId, onTrack, onHome }: { orderId: string; onTrack: () => void; onHome: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div
      className={`flex flex-col items-center text-center gap-6 py-8 transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center animate-bounce">
          <Star className="w-4 h-4 text-white fill-white" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">¡Pedido confirmado!</h2>
        <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">Tu pedido ha sido recibido por la tienda</p>
      </div>

      <div className="w-full bg-white dark:bg-[#0a1628] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-gray-400">Número de pedido</span>
          <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{orderId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-gray-400">Estado</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Preparando
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-gray-400">Tiempo estimado</span>
          <span className="text-sm font-semibold text-slate-800 dark:text-white">15-20 min</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onTrack}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-lg shadow-brand-500/20"
        >
          Ver seguimiento del pedido
        </button>
        <button
          onClick={onHome}
          className="w-full py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 font-medium text-sm transition-colors"
        >
          Volver al Marketplace
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { items, total, clearCart } = useCart();

  const [step, setStep] = useState<Step>(1);
  const [note, setNote] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [address, setAddress] = useState<HomeAddress>({ street: "", references: "", zip: "", colonia: "", city: "Acámbaro, Gto.", phone: "" });
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [card, setCard] = useState<CardData>({ name: "", number: "", expiry: "", cvv: "" });
  const [orderId, setOrderId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pickupBusinesses, setPickupBusinesses] = useState<PickupBusiness[]>([]);

  const shipping = delivery === "home" ? SHIPPING_COST : 0;

  useEffect(() => {
    if (items.length === 0 && step < 5) {
      router.replace("/");
    }
  }, [items.length, step, router]);

  useEffect(() => {
    if (IS_DEMO || items.length === 0) return;
    const ids = Array.from(new Set(items.map((i) => i.business_id))).filter((id) => UUID_RE.test(id));
    if (ids.length === 0) return;
    const supabase = createClient();
    supabase
      .from("businesses")
      .select("id, owner_id, name, address, latitude, longitude, bank_name, bank_holder, bank_clabe, mp_public_key, stripe_charges_enabled, pickup_enabled, meeting_enabled, home_enabled")
      .in("id", ids)
      .then(({ data }) => setPickupBusinesses((data ?? []) as PickupBusiness[]));
  }, [items]);

  useEffect(() => {
    if (!IS_DEMO && isLoaded && !user) {
      router.replace("/login?redirect_url=/checkout");
    }
  }, [isLoaded, user, router]);

  const handleConfirm = async () => {
    if (IS_DEMO || !user) {
      const id = `ACAM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      setOrderId(id);
      clearCart();
      setStep(5);
      return;
    }

    const invalidItem = items.find((i) => !UUID_RE.test(i.business_id) || !UUID_RE.test(i.id));
    if (invalidItem) {
      toast.error(`"${invalidItem.name}" es un producto de demostración y no se puede comprar realmente. Quítalo del carrito para continuar.`);
      return;
    }

    setConfirming(true);
    const supabase = createClient();
    const customerName = user.fullName ?? user.firstName ?? "Cliente";
    const phone = delivery === "home" ? address.phone : contactPhone;
    const selectedMeetingPoint = DEMO_MEETING_POINTS.find((p) => p.id === meetingPoint);
    const deliveryDetails =
      delivery === "home"
        ? address
        : delivery === "meeting"
        ? { meeting_point_name: selectedMeetingPoint?.name ?? meetingPoint, meeting_point_address: selectedMeetingPoint?.address ?? "" }
        : null;

    const byBusiness = new Map<string, typeof items>();
    for (const item of items) {
      const list = byBusiness.get(item.business_id) ?? [];
      list.push(item);
      byBusiness.set(item.business_id, list);
    }

    if ((payment === "mercadopago" || payment === "stripe") && byBusiness.size > 1) {
      toast.error("Con Mercado Pago o Stripe solo puedes pagar productos de una tienda a la vez. Haz un pedido por separado para cada una.");
      setConfirming(false);
      return;
    }

    let firstOrderId: string | null = null;

    for (const [businessId, businessItems] of byBusiness) {
      const businessSubtotal = businessItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const businessShipping = delivery === "home" ? SHIPPING_COST : 0;

      const { data: newOrderId, error } = await supabase.rpc("create_order_with_items", {
        p_business_id: businessId,
        p_user_id: user.id,
        p_customer_name: customerName,
        p_customer_phone: phone || null,
        p_status: "pendiente",
        p_delivery_method: delivery,
        p_payment_method: payment,
        p_address: deliveryDetails,
        p_note: note || null,
        p_subtotal: businessSubtotal,
        p_shipping_cost: businessShipping,
        p_total: businessSubtotal + businessShipping,
        p_items: businessItems.map((i) => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });

      if (error || !newOrderId) {
        toast.error("No se pudo guardar tu pedido. Intenta de nuevo en unos segundos.");
        setConfirming(false);
        return;
      }

      if (!firstOrderId) firstOrderId = newOrderId as string;

      const ownerId = pickupBusinesses.find((b) => b.id === businessId)?.owner_id;
      if (ownerId) {
        await createNotification(supabase, {
          user_id: ownerId,
          type: "new_order",
          title: `Nuevo pedido de ${customerName}`,
          body: `${businessItems.length} producto${businessItems.length === 1 ? "" : "s"} · ${formatPrice(businessSubtotal + businessShipping)}`,
          link: "/dashboard/business/orders",
        });
      }
    }

    if (payment === "mercadopago" && firstOrderId) {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: firstOrderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        toast.error("No se pudo iniciar el pago con Mercado Pago. Tu pedido quedó guardado, contacta a la tienda.");
        setConfirming(false);
        return;
      }
      clearCart();
      window.location.href = data.init_point;
      return;
    }

    if (payment === "stripe" && firstOrderId) {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: firstOrderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error("No se pudo iniciar el pago con Stripe. Tu pedido quedó guardado, contacta a la tienda.");
        setConfirming(false);
        return;
      }
      clearCart();
      window.location.href = data.url;
      return;
    }

    setOrderId(firstOrderId ?? "");
    clearCart();
    setConfirming(false);
    setStep(5);
  };

  const handleTrack = () => router.push(`/checkout/tracking?order=${orderId}`);
  const handleHome = () => router.push("/");

  const next = () => setStep((s) => (s + 1) as Step);

  const stepTitle: Record<Step, string> = {
    1: "Resumen del pedido",
    2: "Método de entrega",
    3: "Método de pago",
    4: "Confirmar pedido",
    5: "",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030810]">
      {/* Sticky header */}
      {step < 5 && (
        <div className="sticky top-0 z-20 bg-white dark:bg-[#060e18] border-b border-slate-200 dark:border-white/10">
          <div className="max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as Step))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-slate-900 dark:text-white text-base flex-1">{stepTitle[step]}</h1>
            {step < 5 && (
              <span className="text-xs text-slate-400 dark:text-gray-500">{step}/4</span>
            )}
          </div>
          <CheckoutProgress step={step} />
        </div>
      )}

      {/* Sticky total bar */}
      {step < 4 && items.length > 0 && (
        <div className="sticky top-[calc(var(--header-h,80px))] z-10 bg-brand-600/95 backdrop-blur-md">
          <div className="max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-white/80 text-xs">
              {items.reduce((s, i) => s + i.quantity, 0)} artículos
            </span>
            <span className="text-white font-bold">{formatPrice(total + shipping)}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-5">
        {step === 1 && (
          <Step1 note={note} setNote={setNote} contactPhone={contactPhone} setContactPhone={setContactPhone} onNext={next} shippingMethod={delivery} />
        )}
        {step === 2 && (
          <Step2
            method={delivery}
            setMethod={setDelivery}
            meetingPoint={meetingPoint}
            setMeetingPoint={setMeetingPoint}
            address={address}
            setAddress={setAddress}
            onNext={next}
            pickupBusinesses={pickupBusinesses}
          />
        )}
        {step === 3 && (
          <Step3
            method={payment}
            setMethod={setPayment}
            cashAmount={cashAmount}
            setCashAmount={setCashAmount}
            card={card}
            setCard={setCard}
            total={total + shipping}
            onNext={next}
            pickupBusinesses={pickupBusinesses}
          />
        )}
        {step === 4 && (
          <Step4
            delivery={delivery}
            meetingPoint={meetingPoint}
            address={address}
            payment={payment}
            cashAmount={cashAmount}
            note={note}
            total={total}
            onConfirm={handleConfirm}
            confirming={confirming}
            pickupBusinesses={pickupBusinesses}
          />
        )}
        {step === 5 && (
          <Step5 orderId={orderId} onTrack={handleTrack} onHome={handleHome} />
        )}
      </div>
    </div>
  );
}
