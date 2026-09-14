// Demo Mode: cuentas ficticias para probar la app sin Clerk/Supabase real.
// Ya no tiene botones de entrada en /login (se quitaron a pedido); la cookie
// demo_mode solo se sigue leyendo por proxy.ts/use-auth-user.ts/DemoBanner.tsx
// por si se necesita reactivar el acceso mas adelante.

export type DemoRole = "buyer" | "seller";

// ── Datos del comprador demo ────────────────────────────────────────────────

export const DEMO_BUYER = {
  userId: "demo_buyer_001",
  name: "Carlos Mendoza",
  firstName: "Carlos",
  email: "demo.comprador@acomdi.mx",
  role: "client" as const,
  phone: "4181234567",
  initials: "CM",
};

// ── Datos del vendedor demo ─────────────────────────────────────────────────

export const DEMO_SELLER = {
  userId: "demo_seller_001",
  name: "Ana García",
  firstName: "Ana",
  email: "demo.tienda@acomdi.mx",
  role: "business" as const,
  businessName: "Ferretería Acámbaro",
  businessId: "demo-ferreteria",
};

// ── Pedidos del comprador ───────────────────────────────────────────────────

export const DEMO_BUYER_ORDERS = [
  {
    id: "ORD-009",
    store: "Ferretería Acámbaro",
    item: "Taladro Percutor 750W",
    total: 889,
    status: "entregado",
    date: "20 Jun 2026",
    storeId: "demo-ferreteria",
  },
  {
    id: "ORD-010",
    store: "Boutique Élite",
    item: "Playera Casual Talla M",
    total: 189,
    status: "en_camino",
    date: "25 Jun 2026",
    storeId: "demo-ropa",
  },
  {
    id: "ORD-011",
    store: "Zapatería Piso Firme",
    item: "Tenis Runner Blanco",
    total: 680,
    status: "pendiente",
    date: "27 Jun 2026",
    storeId: "demo-zapateria",
  },
];

export const DEMO_BUYER_FAVORITES = [
  {
    id: "demo-ferreteria",
    name: "Ferretería Acámbaro",
    category: "Ferretería",
    rating: 4.7,
    emoji: "🔧",
    address: "Av. Morelos 118, Centro, Acámbaro, Gto.",
  },
  {
    id: "demo-ropa",
    name: "Boutique Élite",
    category: "Tienda de ropa",
    rating: 4.5,
    emoji: "👗",
    address: "Calle Hidalgo 22, Centro, Acámbaro, Gto.",
  },
  {
    id: "demo-zapateria",
    name: "Zapatería Piso Firme",
    category: "Zapatería",
    rating: 4.8,
    emoji: "👟",
    address: "Av. Juárez 55, Centro, Acámbaro, Gto.",
  },
];

export const DEMO_BUYER_PRODUCT_FAVORITES = [
  {
    id: "p1",
    name: "Taladro Percutor 1/2\"",
    price: 890,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80",
    business_id: "demo-ferreteria",
    business_name: "Ferretería Acámbaro",
    business_category: "Ferretería",
  },
  {
    id: "r1",
    name: "Playera Básica Algodón",
    price: 189,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    business_id: "demo-ropa",
    business_name: "Boutique Élite",
    business_category: "Tienda de ropa",
  },
  {
    id: "z1",
    name: "Tenis Running Unisex",
    price: 680,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    business_id: "demo-zapateria",
    business_name: "Zapatería Piso Firme",
    business_category: "Zapatería",
  },
];

export const DEMO_BUYER_COUPONS = [
  {
    id: "rc-1",
    title: "15% en herramientas",
    businessName: "Ferretería Acámbaro",
    value: 15,
    type: "percent",
    date: "15 Jun 2026",
  },
  {
    id: "rc-2",
    title: "$50 de descuento",
    businessName: "Boutique Élite",
    value: 50,
    type: "fixed",
    date: "10 Jun 2026",
  },
];

export const DEMO_BUYER_NOTIFICATIONS = [
  {
    id: "n1",
    type: "order",
    title: "Pedido en camino",
    body: "Tu pedido ORD-010 está en camino, llegará hoy.",
    time: "Hace 2 horas",
    read: false,
  },
  {
    id: "n2",
    type: "coupon",
    title: "Nuevo cupón disponible",
    body: "Ferretería Acámbaro: 15% de descuento en herramientas.",
    time: "Hace 1 día",
    read: false,
  },
  {
    id: "n3",
    type: "promo",
    title: "¡Oferta especial!",
    body: "Solo hoy: envío gratis en Boutique Élite.",
    time: "Hace 2 días",
    read: true,
  },
];

// ── Notificaciones del vendedor ─────────────────────────────────────────────

export const DEMO_SELLER_NOTIFICATIONS = [
  {
    id: "sn1",
    type: "order",
    title: "Nuevo pedido",
    body: "María García ordenó: Taladro Percutor 750W",
    time: "Hace 30 min",
    read: false,
  },
  {
    id: "sn2",
    type: "review",
    title: "Nueva reseña",
    body: "Carlos Ramírez te dejó 5 estrellas",
    time: "Hace 3 horas",
    read: false,
  },
  {
    id: "sn3",
    type: "low_stock",
    title: "Stock bajo",
    body: "Taladro Percutor 750W: solo 2 unidades restantes",
    time: "Hace 1 día",
    read: true,
  },
  {
    id: "sn4",
    type: "order",
    title: "Pedido entregado",
    body: "ORD-005 marcado como entregado",
    time: "Hace 2 días",
    read: true,
  },
];

// ── Datos de checkout demo ──────────────────────────────────────────────────

export const DEMO_CHECKOUT_BUSINESS = {
  name: "Ferretería Acámbaro",
  address: "Calle Juárez 45, Centro, Acámbaro, Gto.",
  hours: "Lun-Sab 9:00 - 19:00",
  phone: "4011234567",
  prepTime: "15-20 min",
  deliveryCost: 35,
  minOrder: 150,
};

export const DEMO_MEETING_POINTS = [
  { id: "plaza", name: "Plaza Principal", address: "Jardín Hidalgo, Centro", distance: "0.3 km", time: "5 min", emoji: "🏛️" },
  { id: "jardin", name: "Jardín Central", address: "Av. Obregón s/n, Centro", distance: "0.5 km", time: "7 min", emoji: "🌳" },
  { id: "terminal", name: "Terminal de Autobuses", address: "Blvd. Lázaro Cárdenas 12", distance: "1.2 km", time: "15 min", emoji: "🚌" },
  { id: "walmart", name: "Walmart", address: "Carretera a Morelia km 2", distance: "2.1 km", time: "20 min", emoji: "🛒" },
  { id: "soriana", name: "Soriana", address: "Av. López Mateos 100", distance: "1.8 km", time: "18 min", emoji: "🏪" },
];

export const DEMO_BANK_DETAILS = {
  bank: "BBVA",
  clabe: "012340001234567890",
  account: "1234 5678",
  holder: "Ferretería Acámbaro S.A.",
  reference: "ACAM-",
};

// ── Helpers de cookie (client-side) ────────────────────────────────────────

export function getDemoMode(): DemoRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/demo_mode=([^;]+)/);
  return (match?.[1] as DemoRole) ?? null;
}

export function stopDemoMode(): void {
  document.cookie = "demo_mode=; path=/; max-age=0";
  window.location.href = "/";
}
