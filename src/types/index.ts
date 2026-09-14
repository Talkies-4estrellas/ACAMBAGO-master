import type { LucideIcon } from "lucide-react";
import {
  Shirt, Footprints, Pill, Wrench, Notebook, Smartphone, Gem,
  ShoppingBag, Sofa, ShoppingCart, SprayCan, PawPrint, Palette,
  Dumbbell, ToyBrick, BookOpen, Store,
} from "lucide-react";

export type UserRole = "client" | "business" | "admin";
export type DiscountType = "percent" | "fixed";

export interface Profile {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  notes?: string;
  colonia?: string;
  zip?: string;
  city: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  latitude?: number;
  longitude?: number;
  whatsapp?: string;
  image_url?: string;
  banner_url?: string;
  bank_name?: string;
  bank_holder?: string;
  bank_clabe?: string;
  mp_public_key?: string;
  mp_access_token?: string;
  stripe_account_id?: string;
  stripe_charges_enabled?: boolean;
  pickup_enabled?: boolean;
  meeting_enabled?: boolean;
  home_enabled?: boolean;
  coupon_credits?: number;
  rating_avg: number;
  rating_count: number;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_urls?: string[];
  is_available: boolean;
  stock_quantity?: number;
  // Categorías propias del producto (puede tener varias, ej. un accesorio
  // vendido por una tienda de ropa), independientes de businesses.category.
  // Opcional en el tipo porque puede venir vacío en filas viejas si
  // supabase/product-categories.sql todavía no se corrió en este entorno.
  categories?: string[];
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  discount_type: DiscountType;
  value: number;
  code: string;
  qr_data: string;
  limit_count?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// Historial de asignaciones de cupones disponibles hechas por un admin a un
// negocio (ver supabase/coupon-credits.sql). No confundir con `Coupon`: esto
// es el "saldo" que le permite al vendedor crear cupones nuevos, no un cupón.
export interface CouponCreditGrant {
  id: string;
  business_id: string;
  admin_user_id: string;
  amount: number;
  created_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  user_id?: string;
  business_id: string;
  redeemed_at: string;
  sale_amount?: number;
  discount_amount?: number;
}

// Resultado posible de cada intento de escaneo (ver supabase/coupon-scan-audit.sql).
// "redeemed" cubre tanto un escaneo válido (fase "scan", nada se marca todavía)
// como un canje ya confirmado (fase "confirm", el cupón queda usado).
export type CouponScanOutcome =
  | "redeemed"
  | "duplicate"
  | "invalid_code"
  | "inactive"
  | "expired"
  | "limit_reached"
  | "wrong_business";

// Auditoría de CADA intento de escaneo, exitoso o no — a diferencia de
// `CouponRedemption`, que solo existe para los canjes que sí se concretaron.
export interface CouponScanLog {
  id: string;
  business_id?: string;
  coupon_id?: string;
  scanned_code: string;
  scanned_by: string;
  customer_user_id?: string;
  phase: "scan" | "confirm";
  outcome: CouponScanOutcome;
  detail?: string;
  created_at: string;
}

// Respuesta del RPC `redeem_coupon` (ver supabase/coupon-scan-audit.sql),
// tal como la usa /api/coupons/validate.
export interface RedeemCouponResult {
  outcome: CouponScanOutcome;
  message: string;
  coupon_id: string | null;
  coupon_title: string | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  out_coupon_code: string | null;
  business_name: string | null;
  redemption_id: string | null;
  sale_amount: number | null;
  discount_amount: number | null;
  final_amount: number | null;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  business_id: string;
  user_id: string;
  question: string;
  answer?: string;
  answered_at?: string;
  created_at: string;
}

export type NotificationType = "order_status" | "new_order" | "question_answered" | "new_question" | "new_message" | "new_business_pending";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type MessageSenderRole = "customer" | "business";

export interface Conversation {
  id: string;
  business_id: string;
  user_id: string;
  customer_name: string;
  product_id?: string;
  product_name?: string;
  last_message?: string;
  last_sender_role?: MessageSenderRole;
  last_message_at: string;
  customer_read_at: string;
  business_read_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_role: MessageSenderRole;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: Pick<Profile, "name" | "avatar_url">;
}

export type OrderStatus = "pendiente" | "en_camino" | "entregado" | "cancelado";
export type PaymentStatus = "pendiente" | "pagado" | "fallido";
export type DeliveryMethod = "pickup" | "meeting" | "home";
export type PaymentMethod = "cash" | "card" | "transfer" | "cod" | "mercadopago" | "stripe";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  business_id: string;
  user_id: string;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  address?: Record<string, string>;
  note?: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: PaymentStatus;
  mp_preference_id?: string;
  mp_payment_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface QRPayload {
  coupon_code: string;
  business_id: string;
  user_id?: string;
}

export const BUSINESS_CATEGORIES = [
  "Tienda de ropa",
  "Zapatería",
  "Farmacia",
  "Ferretería",
  "Papelería",
  "Electrónica",
  "Joyería",
  "Accesorios",
  "Mueblería",
  "Abarrotes",
  "Cosméticos",
  "Mascotas",
  "Artesanías",
  "Deportes",
  "Juguetería",
  "Librería",
  "Otro",
] as const;

// Íconos planos (lucide-react) por categoría de negocio. Antes eran emoji
// nativos del sistema operativo, que se ven con sombreado 3D/glossy según
// el dispositivo (notorio en Android/Samsung); esto los deja consistentes
// en cualquier pantalla. Úsalos con el componente <CategoryIcon />.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Tienda de ropa": Shirt,
  "Zapatería": Footprints,
  "Farmacia": Pill,
  "Ferretería": Wrench,
  "Papelería": Notebook,
  "Electrónica": Smartphone,
  "Joyería": Gem,
  "Accesorios": ShoppingBag,
  "Mueblería": Sofa,
  "Abarrotes": ShoppingCart,
  "Cosméticos": SprayCan,
  "Mascotas": PawPrint,
  "Artesanías": Palette,
  "Deportes": Dumbbell,
  "Juguetería": ToyBrick,
  "Librería": BookOpen,
  "Otro": Store,
};
