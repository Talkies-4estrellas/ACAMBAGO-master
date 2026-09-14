import { Business, Product, Coupon, Review } from "@/types";

// ─── NEGOCIOS DEMO ────────────────────────────────────────────────────────────

export const DEMO_BUSINESSES: Business[] = [
  {
    id: "demo",
    owner_id: "demo-owner",
    name: "Ferretería y Materiales Acámbaro",
    description: "Tu ferretería de confianza con más de 30 años. Herramientas, materiales de construcción, pinturas, plomería, electricidad y más.",
    category: "Ferretería",
    address: "Av. Morelos 118, Centro, Acámbaro, Gto.",
    latitude: 20.0321,
    longitude: -100.7268,
    whatsapp: "4181234567",
    image_url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.7,
    rating_count: 89,
    is_approved: true,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "demo-lavado",
    owner_id: "demo-owner-2",
    name: "Boutique de Ropa Acámbaro",
    description: "Moda para toda la familia. Ropa de temporada, casual, formal y deportiva con las mejores marcas al mejor precio.",
    category: "Tienda de ropa",
    address: "Calle Hidalgo 22, Centro, Acámbaro, Gto.",
    latitude: 20.034,
    longitude: -100.729,
    whatsapp: "4182345678",
    image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.8,
    rating_count: 67,
    is_approved: true,
    is_active: true,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "demo-cerrajero",
    owner_id: "demo-owner-3",
    name: "Zapatería El Paso",
    description: "Calzado para dama, caballero y niño. Tenis, botas, sandalias y zapato formal. Comodidad y estilo en cada paso.",
    category: "Zapatería",
    address: "Av. Juárez 55, Centro, Acámbaro, Gto.",
    latitude: 20.0315,
    longitude: -100.726,
    whatsapp: "4183456789",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.7,
    rating_count: 84,
    is_approved: true,
    is_active: true,
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  },
  {
    id: "demo-pintor",
    owner_id: "demo-owner-4",
    name: "TechStore Acámbaro",
    description: "Celulares, accesorios, laptops, audífonos, cargadores y electrónica en general. Las mejores marcas con garantía.",
    category: "Electrónica",
    address: "Blvd. Revolución 88, Acámbaro, Gto.",
    latitude: 20.0308,
    longitude: -100.7255,
    whatsapp: "4184567890",
    image_url: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.6,
    rating_count: 52,
    is_approved: true,
    is_active: true,
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-04-01T00:00:00Z",
  },
  {
    id: "demo-salon",
    owner_id: "demo-owner-5",
    name: "Joyería Acámbaro Gold",
    description: "Aretes, pulseras, collares y anillos en oro, plata y acero. Joyería fina y fantasía para toda ocasión.",
    category: "Joyería",
    address: "Calle Aldama 10, Centro, Acámbaro, Gto.",
    latitude: 20.0325,
    longitude: -100.728,
    whatsapp: "4185678901",
    image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.9,
    rating_count: 98,
    is_approved: true,
    is_active: true,
    created_at: "2024-05-01T00:00:00Z",
    updated_at: "2024-05-01T00:00:00Z",
  },
  {
    id: "demo-farmacia",
    owner_id: "demo-owner-6",
    name: "Farmacia San Rafael",
    description: "Medicamentos, vitaminas, productos de salud y cuidado personal. Atención 7 días a la semana.",
    category: "Farmacia",
    address: "Blvd. Revolución 210, Acámbaro, Gto.",
    latitude: 20.033,
    longitude: -100.727,
    whatsapp: "4186789012",
    image_url: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.6,
    rating_count: 203,
    is_approved: true,
    is_active: true,
    created_at: "2024-05-15T00:00:00Z",
    updated_at: "2024-05-15T00:00:00Z",
  },
  {
    id: "demo-taller",
    owner_id: "demo-owner-7",
    name: "Cosméticos Belleza Natural",
    description: "Maquillaje, skincare, perfumes y productos de belleza. Marcas nacionales e internacionales con los mejores precios.",
    category: "Cosméticos",
    address: "Calle Morelos 77, Centro, Acámbaro, Gto.",
    latitude: 20.029,
    longitude: -100.724,
    whatsapp: "4187890123",
    image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.8,
    rating_count: 115,
    is_approved: true,
    is_active: true,
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
  },
  {
    id: "demo-veterinaria",
    owner_id: "demo-owner-8",
    name: "PetShop Acámbaro",
    description: "Alimentos, accesorios, juguetes y productos de higiene para tus mascotas. Todo lo que tu compañero necesita.",
    category: "Mascotas",
    address: "Av. Juárez 88, Col. Centro, Acámbaro, Gto.",
    latitude: 20.031,
    longitude: -100.7265,
    whatsapp: "4188901234",
    image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.9,
    rating_count: 145,
    is_approved: true,
    is_active: true,
    created_at: "2024-06-15T00:00:00Z",
    updated_at: "2024-06-15T00:00:00Z",
  },
  {
    id: "demo-papeleria",
    owner_id: "demo-owner-9",
    name: "Papelería El Estudiante",
    description: "Útiles escolares, cuadernos, colores, mochilas, artículos de arte y papelería de oficina. Todo para tu escuela.",
    category: "Papelería",
    address: "Calle Aldama 33, Centro, Acámbaro, Gto.",
    latitude: 20.0318,
    longitude: -100.7272,
    whatsapp: "4189012345",
    image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.5,
    rating_count: 76,
    is_approved: true,
    is_active: true,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
  {
    id: "demo-muebles",
    owner_id: "demo-owner-10",
    name: "Mueblería El Hogar",
    description: "Salas, recámaras, comedores, colchones y muebles de oficina. Diseño, comodidad y financiamiento disponible.",
    category: "Mueblería",
    address: "Carr. Acámbaro-Morelia Km 1, Acámbaro, Gto.",
    latitude: 20.0295,
    longitude: -100.722,
    whatsapp: "4181122334",
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.7,
    rating_count: 61,
    is_approved: true,
    is_active: true,
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2024-08-01T00:00:00Z",
  },
  {
    id: "demo-artesanias",
    owner_id: "demo-owner-11",
    name: "Artesanías de Acámbaro",
    description: "Barro negro, talavera, textiles, madera tallada y recuerdos típicos de Acámbaro y el Bajío. Arte hecho a mano.",
    category: "Artesanías",
    address: "Plaza Principal s/n, Centro, Acámbaro, Gto.",
    latitude: 20.0322,
    longitude: -100.7275,
    whatsapp: "4182233445",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.9,
    rating_count: 134,
    is_approved: true,
    is_active: true,
    created_at: "2024-08-15T00:00:00Z",
    updated_at: "2024-08-15T00:00:00Z",
  },
  {
    id: "demo-deportes",
    owner_id: "demo-owner-12",
    name: "Deportes Acámbaro",
    description: "Ropa deportiva, tenis, equipos de futbol, gym, ciclismo y más. Todo para mantenerte activo con las mejores marcas.",
    category: "Deportes",
    address: "Av. Tecnológico 34, Acámbaro, Gto.",
    latitude: 20.0335,
    longitude: -100.7245,
    whatsapp: "4183344556",
    image_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    banner_url: undefined,
    rating_avg: 4.6,
    rating_count: 88,
    is_approved: true,
    is_active: true,
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2024-09-01T00:00:00Z",
  },
];

export const DEMO_BUSINESS = DEMO_BUSINESSES[0];

// Se combinan en la exportacion final — ver abajo


// ─── PRODUCTOS DEMO ───────────────────────────────────────────────────────────

export const DEMO_PRODUCTS: Product[] = [
  { id: "p1", business_id: "demo", name: "Taladro Percutor 1/2\"", description: "Taladro 750W con reversa, velocidad variable y maletín incluido", price: 890, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "p2", business_id: "demo", name: "Pintura Vinílica 4L", description: "Pintura lavable interior, colores variados, acabado mate", price: 320, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "p3", business_id: "demo", name: "Llave de Paso 1/2\" (juego)", description: "Llave de paso cromada con empaque, uso en tuberías de agua", price: 145, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "p4", business_id: "demo", name: "Kit Fumigador Portátil 5L", description: "Bomba de fumigación manual con boquilla ajustable para jardines y patios", price: 280, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_ROPA: Product[] = [
  { id: "r1", business_id: "demo-lavado", name: "Playera Básica Algodón", description: "100% algodón peinado, disponible en 12 colores, tallas XS-XXL", price: 189, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "r2", business_id: "demo-lavado", name: "Jeans Slim Fit Hombre", description: "Mezclilla elastizada, corte moderno, varios colores", price: 450, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "r3", business_id: "demo-lavado", name: "Vestido Casual Floral", description: "Tela ligera, perfecto para primavera-verano, tallas S-XL", price: 380, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "r4", business_id: "demo-lavado", name: "Chamarra Universitaria", description: "Tela impermeable, forro polar, bolsillos con cierre", price: 650, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_ZAPATERIA: Product[] = [
  { id: "z1", business_id: "demo-cerrajero", name: "Tenis Running Unisex", description: "Suela amortiguada, transpirable, ideal para correr y caminar", price: 680, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "z2", business_id: "demo-cerrajero", name: "Bota Casual Hombre", description: "Cuero genuino, suela antiderrapante, múltiples tallas", price: 890, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "z3", business_id: "demo-cerrajero", name: "Sandalia Dama Verano", description: "Correa ajustable, plantilla acolchada, colores variados", price: 320, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "z4", business_id: "demo-cerrajero", name: "Zapato Escolar Niño", description: "Piel sintética, velcro, tallas 16-24, negro y café", price: 280, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_ELECTRONICA: Product[] = [
  { id: "e1", business_id: "demo-pintor", name: "Audífonos Bluetooth", description: "Cancelación de ruido, batería 30 hrs, plegables, sonido HD", price: 749, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "e2", business_id: "demo-pintor", name: "Cargador Rápido 65W", description: "USB-C, compatible con la mayoría de celulares y laptops", price: 320, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "e3", business_id: "demo-pintor", name: "Bocina Portátil Bluetooth", description: "Resistente al agua IPX7, 12 hrs batería, sonido 360°", price: 580, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "e4", business_id: "demo-pintor", name: "Smartwatch Deportivo", description: "Monitor de ritmo cardiaco, GPS, resistente al agua, pantalla AMOLED", price: 1290, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_JOYERIA: Product[] = [
  { id: "j1", business_id: "demo-salon", name: "Aretes Plata 925 Perla", description: "Perla cultivada, cierre de rosca, tamaño mediano, caja regalo incluida", price: 420, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "j2", business_id: "demo-salon", name: "Pulsera Oro Laminado 18K", description: "Cadena esclava 4mm, largo 19cm, con garantía de bañado", price: 680, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "j3", business_id: "demo-salon", name: "Collar Corazón Plata", description: "Dije de corazón con circonita, cadena 45cm, apto para todo tipo de piel", price: 350, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "j4", business_id: "demo-salon", name: "Anillo Compromiso Plata", description: "Piedra circonita blanca corte brillante, tallas del 4 al 10", price: 520, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_FARMACIA: Product[] = [
  { id: "f1", business_id: "demo-farmacia", name: "Vitamina C 1000mg (60 tabs)", description: "Vitamina C de alta potencia con zinc, refuerza el sistema inmune", price: 89, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "f2", business_id: "demo-farmacia", name: "Multivitamínico Daily", description: "Complejo de vitaminas y minerales esenciales para adultos", price: 120, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "f3", business_id: "demo-farmacia", name: "Termómetro Digital", description: "Medición en 10 segundos, pantalla LCD, memoria de última lectura", price: 145, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "f4", business_id: "demo-farmacia", name: "Alcohol en Gel 500ml", description: "70% isopropílico, fórmula hidratante con vitamina E", price: 65, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_COSMETICOS: Product[] = [
  { id: "co1", business_id: "demo-taller", name: "Base de Maquillaje FPS 30", description: "Cobertura media-alta, 24 tonos, larga duración y efecto mate", price: 280, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "co2", business_id: "demo-taller", name: "Sérum Vitamina C 30ml", description: "Antioxidante, iluminador, reduce manchas y unifica el tono", price: 350, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "co3", business_id: "demo-taller", name: "Perfume Mujer 100ml", description: "Fragancia floral-amaderada, alta concentración, duración 12 hrs", price: 490, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "co4", business_id: "demo-taller", name: "Paleta de Sombras 18 tonos", description: "Pigmentos de alta intensidad, acabados mate y shimmer", price: 220, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_PETSHOP: Product[] = [
  { id: "pe1", business_id: "demo-veterinaria", name: "Alimento Premium Perro 15kg", description: "Croquetas con pollo y arroz, sin colorantes, para adultos", price: 580, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "pe2", business_id: "demo-veterinaria", name: "Arena Aglutinante Gato 5kg", description: "Absorbe olores al instante, fácil limpieza, bajo polvo", price: 120, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "pe3", business_id: "demo-veterinaria", name: "Cama Ortopédica Canina M", description: "Espuma viscoelástica, funda lavable, ideal para razas medianas", price: 450, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "pe4", business_id: "demo-veterinaria", name: "Kit de Juguetes para Gato", description: "Plumas, ratones de felpa y pelota con cascabel, set de 6 piezas", price: 95, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_PAPELERIA: Product[] = [
  { id: "pp1", business_id: "demo-papeleria", name: "Cuaderno Profesional 100 hjs", description: "Cuadro chico, pasta dura, perforado para carpeta", price: 45, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "pp2", business_id: "demo-papeleria", name: "Set de Colores 48 pzas", description: "Colores de madera, punta resistente, caja organizadora", price: 120, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "pp3", business_id: "demo-papeleria", name: "Mochila Escolar Resistente", description: "2 compartimentos, bolsillo USB, espuma en espalda, varios colores", price: 320, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "pp4", business_id: "demo-papeleria", name: "Kit de Geometría 7 pzas", description: "Compás, escuadras, transportador, regla y lápiz, estuche incluido", price: 85, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_MUEBLES: Product[] = [
  { id: "m1", business_id: "demo-muebles", name: "Sala 3-2-1 Taupe", description: "Tela antimanchas, espuma alta densidad, incluye cojines decorativos", price: 8900, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "m2", business_id: "demo-muebles", name: "Comedor 6 Sillas Madera", description: "Madera maciza de pino, mesa extensible, barniz natural", price: 6500, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "m3", business_id: "demo-muebles", name: "Colchón Matrimonial Memory", description: "Espuma viscoelástica 30cm, 10 años garantía, funda extraíble", price: 4200, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "m4", business_id: "demo-muebles", name: "Escritorio Ejecutivo", description: "Tablero MDF negro, cajones con llave, incluye espacio para CPU", price: 2800, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_ARTESANIAS: Product[] = [
  { id: "a1", business_id: "demo-artesanias", name: "Figura de Barro Negro", description: "Pieza artesanal única, modelada a mano por artesanos locales, 20cm alt.", price: 280, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "a2", business_id: "demo-artesanias", name: "Tapete Tejido de Palma", description: "Fibra natural de palma, diseños geométricos tradicionales, 60x40cm", price: 180, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "a3", business_id: "demo-artesanias", name: "Jarro Talavera 1L", description: "Cerámica pintada a mano, diseños florales, apto para uso diario", price: 150, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "a4", business_id: "demo-artesanias", name: "Set de 3 Veladoras Artesanales", description: "Cera natural de abeja con aromas de copal, vainilla y lavanda", price: 120, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_PRODUCTS_DEPORTES: Product[] = [
  { id: "d1", business_id: "demo-deportes", name: "Balón Futbol #5 Profesional", description: "Cubierta de PVC termosoldada, vejiga látex, uso en cancha o pasto", price: 350, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "d2", business_id: "demo-deportes", name: "Mancuernas 5kg (par)", description: "Recubrimiento de goma antiderrapante, hexagonales para no rodar", price: 420, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "d3", business_id: "demo-deportes", name: "Pants Deportivo Unisex", description: "Poliéster respirable, bolsillos laterales, tallas S-XXL", price: 380, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
  { id: "d4", business_id: "demo-deportes", name: "Cuerda para Saltar Pro", description: "Cable acero con mangos ergonómicos, ajustable, contador de saltos", price: 180, image_url: undefined, is_available: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

// ─── CUPONES DEMO ─────────────────────────────────────────────────────────────

export const DEMO_COUPONS: Coupon[] = [
  { id: "cu1", business_id: "demo", title: "15% en herramientas eléctricas", description: "Descuento en toda la línea. Válido de lunes a viernes.", discount_type: "percent", value: 15, code: "ACAM-HERRA", qr_data: JSON.stringify({ coupon_code: "ACAM-HERRA", business_id: "demo" }), limit_count: 80, used_count: 21, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "cu2", business_id: "demo", title: "$50 en compras mayores a $500", description: "Aplica en toda la tienda.", discount_type: "fixed", value: 50, code: "ACAM-FERRO", qr_data: JSON.stringify({ coupon_code: "ACAM-FERRO", business_id: "demo" }), limit_count: 60, used_count: 8, expires_at: "2026-09-30T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_LAVADO: Coupon[] = [
  { id: "cu3", business_id: "demo-lavado", title: "20% en toda la ropa de temporada", description: "Colección primavera-verano con descuento especial.", discount_type: "percent", value: 20, code: "ACAM-ROPA", qr_data: JSON.stringify({ coupon_code: "ACAM-ROPA", business_id: "demo-lavado" }), limit_count: 50, used_count: 12, expires_at: "2026-10-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_CERRAJERO: Coupon[] = [
  { id: "cu4", business_id: "demo-cerrajero", title: "$100 en compras mayores a $700", description: "Válido en tenis y botas.", discount_type: "fixed", value: 100, code: "ACAM-ZAPATO", qr_data: JSON.stringify({ coupon_code: "ACAM-ZAPATO", business_id: "demo-cerrajero" }), limit_count: 30, used_count: 5, expires_at: "2026-08-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_PINTOR: Coupon[] = [
  { id: "cu5", business_id: "demo-pintor", title: "10% en accesorios electrónicos", description: "Audífonos, cargadores y bocinas en oferta.", discount_type: "percent", value: 10, code: "ACAM-TECH", qr_data: JSON.stringify({ coupon_code: "ACAM-TECH", business_id: "demo-pintor" }), limit_count: 40, used_count: 9, expires_at: "2026-11-30T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_SALON: Coupon[] = [
  { id: "cu6", business_id: "demo-salon", title: "$80 de descuento en joyería de plata", description: "Aplica en aretes, collares y pulseras de plata 925.", discount_type: "fixed", value: 80, code: "ACAM-GOLD", qr_data: JSON.stringify({ coupon_code: "ACAM-GOLD", business_id: "demo-salon" }), limit_count: 25, used_count: 7, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_FARMACIA: Coupon[] = [
  { id: "cu7", business_id: "demo-farmacia", title: "2x1 en vitaminas y suplementos", description: "Lleva dos unidades al precio de una, temporada limitada.", discount_type: "percent", value: 50, code: "ACAM-SALUD", qr_data: JSON.stringify({ coupon_code: "ACAM-SALUD", business_id: "demo-farmacia" }), limit_count: 50, used_count: 18, expires_at: "2026-09-30T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_TALLER: Coupon[] = [
  { id: "cu8", business_id: "demo-taller", title: "15% en tu primer compra de cosméticos", description: "Solo para clientes nuevos, aplica en toda la tienda.", discount_type: "percent", value: 15, code: "ACAM-BELLA", qr_data: JSON.stringify({ coupon_code: "ACAM-BELLA", business_id: "demo-taller" }), limit_count: 60, used_count: 14, expires_at: "2026-10-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_VETERINARIA: Coupon[] = [
  { id: "cu9", business_id: "demo-veterinaria", title: "10% en alimento para mascotas", description: "Descuento en todas las marcas premium de alimento.", discount_type: "percent", value: 10, code: "ACAM-PET", qr_data: JSON.stringify({ coupon_code: "ACAM-PET", business_id: "demo-veterinaria" }), limit_count: 40, used_count: 11, expires_at: "2026-11-30T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_PAPELERIA: Coupon[] = [
  { id: "cu10", business_id: "demo-papeleria", title: "Kit escolar completo con 20% de descuento", description: "Paquete especial de regreso a clases.", discount_type: "percent", value: 20, code: "ACAM-PAPEL", qr_data: JSON.stringify({ coupon_code: "ACAM-PAPEL", business_id: "demo-papeleria" }), limit_count: 100, used_count: 33, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_MUEBLES: Coupon[] = [
  { id: "cu11", business_id: "demo-muebles", title: "$500 en compras mayores a $5,000", description: "Amohla tu hogar con el mejor precio.", discount_type: "fixed", value: 500, code: "ACAM-HOGAR", qr_data: JSON.stringify({ coupon_code: "ACAM-HOGAR", business_id: "demo-muebles" }), limit_count: 20, used_count: 3, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_ARTESANIAS: Coupon[] = [
  { id: "cu12", business_id: "demo-artesanias", title: "3x2 en artesanías de barro", description: "Lleva tres figuras y paga solo dos.", discount_type: "percent", value: 33, code: "ACAM-ARTE", qr_data: JSON.stringify({ coupon_code: "ACAM-ARTE", business_id: "demo-artesanias" }), limit_count: 30, used_count: 8, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

export const DEMO_COUPONS_DEPORTES: Coupon[] = [
  { id: "cu13", business_id: "demo-deportes", title: "15% en ropa y tenis deportivos", description: "Empieza tu rutina con el mejor equipo a mejor precio.", discount_type: "percent", value: 15, code: "ACAM-SPORT", qr_data: JSON.stringify({ coupon_code: "ACAM-SPORT", business_id: "demo-deportes" }), limit_count: 45, used_count: 16, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: "2024-01-01T00:00:00Z" },
];

// ─── RESEÑAS DEMO ─────────────────────────────────────────────────────────────

export const DEMO_REVIEWS: Review[] = [
  { id: "r1", business_id: "demo", user_id: "u1", rating: 5, comment: "Excelente atención, me asesoraron muy bien para la instalación eléctrica.", created_at: "2025-03-10T14:00:00Z", profiles: { name: "Roberto Mendoza", avatar_url: undefined } },
  { id: "r2", business_id: "demo", user_id: "u2", rating: 5, comment: "Tienen todo lo que necesitas. El personal conoce bien los productos.", created_at: "2025-04-22T10:30:00Z", profiles: { name: "Lucía Vargas", avatar_url: undefined } },
  { id: "r3", business_id: "demo", user_id: "u3", rating: 4, comment: "Buen surtido de pinturas y plomería. Productos de calidad.", created_at: "2025-05-15T19:00:00Z", profiles: { name: "José Hernández", avatar_url: undefined } },
];

export const DEMO_REVIEWS_LAVADO: Review[] = [
  { id: "rv1", business_id: "demo-lavado", user_id: "u4", rating: 5, comment: "Me encantó la chamarra que compré, la calidad es excelente y el precio muy justo.", created_at: "2025-04-01T11:00:00Z", profiles: { name: "Diana Torres", avatar_url: undefined } },
  { id: "rv2", business_id: "demo-lavado", user_id: "u5", rating: 5, comment: "Buena variedad de estilos y las tallas están bien surtidas. Muy recomendada.", created_at: "2025-05-20T09:00:00Z", profiles: { name: "Marcos Ríos", avatar_url: undefined } },
];

export const DEMO_REVIEWS_CERRAJERO: Review[] = [
  { id: "rv3", business_id: "demo-cerrajero", user_id: "u6", rating: 5, comment: "Los tenis son muy cómodos y duraron mucho. Excelente relación calidad-precio.", created_at: "2025-02-14T22:30:00Z", profiles: { name: "Sofía Castillo", avatar_url: undefined } },
  { id: "rv4", business_id: "demo-cerrajero", user_id: "u7", rating: 5, comment: "Encontré el modelo que buscaba en mi talla. El trato fue muy amable.", created_at: "2025-03-28T16:00:00Z", profiles: { name: "Ernesto Guzmán", avatar_url: undefined } },
];

export const DEMO_REVIEWS_PINTOR: Review[] = [
  { id: "rv5", business_id: "demo-pintor", user_id: "u8", rating: 5, comment: "Los audífonos suenan increíble y la batería dura todo el día.", created_at: "2025-01-18T08:00:00Z", profiles: { name: "Patricia Luna", avatar_url: undefined } },
  { id: "rv6", business_id: "demo-pintor", user_id: "u9", rating: 4, comment: "Buena atención y garantía real. Me cambiaron un artículo sin problema.", created_at: "2025-04-05T14:30:00Z", profiles: { name: "Ignacio Pérez", avatar_url: undefined } },
];

export const DEMO_REVIEWS_SALON: Review[] = [
  { id: "rv7", business_id: "demo-salon", user_id: "u10", rating: 5, comment: "Los aretes de plata son preciosos, los uso todos los días y no se manchan.", created_at: "2025-05-10T10:00:00Z", profiles: { name: "Fernanda López", avatar_url: undefined } },
  { id: "rv8", business_id: "demo-salon", user_id: "u11", rating: 5, comment: "Excelente joyería a precios accesibles. El empaque de regalo quedó perfecto.", created_at: "2025-06-01T15:00:00Z", profiles: { name: "Valeria Mora", avatar_url: undefined } },
];

export const DEMO_REVIEWS_FARMACIA: Review[] = [
  { id: "rv9", business_id: "demo-farmacia", user_id: "u12", rating: 5, comment: "Siempre tienen existencia de los medicamentos que necesito. Muy confiable.", created_at: "2025-04-15T09:00:00Z", profiles: { name: "Gerardo Núñez", avatar_url: undefined } },
  { id: "rv10", business_id: "demo-farmacia", user_id: "u13", rating: 4, comment: "Buenos precios en vitaminas y atención amable.", created_at: "2025-05-22T12:00:00Z", profiles: { name: "Carmen Salinas", avatar_url: undefined } },
];

export const DEMO_REVIEWS_TALLER: Review[] = [
  { id: "rv11", business_id: "demo-taller", user_id: "u14", rating: 5, comment: "El sérum de vitamina C me quitó las manchas en pocas semanas. Increíble.", created_at: "2025-03-20T14:00:00Z", profiles: { name: "Arturo Vega", avatar_url: undefined } },
  { id: "rv12", business_id: "demo-taller", user_id: "u15", rating: 5, comment: "Gran variedad de productos y muy buen asesoramiento para elegir el tono correcto.", created_at: "2025-05-05T11:00:00Z", profiles: { name: "Paola Ramírez", avatar_url: undefined } },
];

export const DEMO_REVIEWS_VETERINARIA: Review[] = [
  { id: "rv13", business_id: "demo-veterinaria", user_id: "u16", rating: 5, comment: "El alimento premium que recomendaron mejoró mucho la energía de mi perro.", created_at: "2025-04-28T09:30:00Z", profiles: { name: "Alejandra Fuentes", avatar_url: undefined } },
  { id: "rv14", business_id: "demo-veterinaria", user_id: "u17", rating: 5, comment: "Tienen todo lo que necesita mi gato y a muy buen precio. Regreso siempre.", created_at: "2025-06-03T16:00:00Z", profiles: { name: "Manuel Ortiz", avatar_url: undefined } },
];

export const DEMO_REVIEWS_PAPELERIA: Review[] = [
  { id: "rv15", business_id: "demo-papeleria", user_id: "u18", rating: 5, comment: "Cuadernos de buena calidad y la mochila que compré para mi hija es muy resistente.", created_at: "2025-05-18T08:30:00Z", profiles: { name: "Daniela Cruz", avatar_url: undefined } },
  { id: "rv16", business_id: "demo-papeleria", user_id: "u19", rating: 4, comment: "Buena variedad de útiles y precios accesibles. El set de geometría es excelente.", created_at: "2025-06-10T13:00:00Z", profiles: { name: "Rodrigo Ibáñez", avatar_url: undefined } },
];

export const DEMO_REVIEWS_MUEBLES: Review[] = [
  { id: "rv17", business_id: "demo-muebles", user_id: "u20", rating: 5, comment: "La sala que compré es muy cómoda y la tela no se mancha fácil. Excelente calidad.", created_at: "2025-05-01T10:00:00Z", profiles: { name: "Rosa Medina", avatar_url: undefined } },
  { id: "rv18", business_id: "demo-muebles", user_id: "u21", rating: 5, comment: "El colchón de memory foam es lo mejor que he comprado. Duermo increíble.", created_at: "2025-06-05T09:00:00Z", profiles: { name: "Benjamín Reyes", avatar_url: undefined } },
];

export const DEMO_REVIEWS_ARTESANIAS: Review[] = [
  { id: "rv19", business_id: "demo-artesanias", user_id: "u22", rating: 5, comment: "Compré varias figuras de barro como recuerdo. Son únicas y están muy bien hechas.", created_at: "2025-04-20T15:00:00Z", profiles: { name: "Claudia Santos", avatar_url: undefined } },
  { id: "rv20", business_id: "demo-artesanias", user_id: "u23", rating: 5, comment: "Las veladoras artesanales huelen increíble y duran mucho tiempo. Me encantaron.", created_at: "2025-05-30T12:00:00Z", profiles: { name: "Mario Lara", avatar_url: undefined } },
];

export const DEMO_REVIEWS_DEPORTES: Review[] = [
  { id: "rv21", business_id: "demo-deportes", user_id: "u24", rating: 5, comment: "El balón de futbol es de muy buena calidad, ya llevamos varios partidos y aguanta perfecto.", created_at: "2025-05-12T17:00:00Z", profiles: { name: "Carlos Moreno", avatar_url: undefined } },
  { id: "rv22", business_id: "demo-deportes", user_id: "u25", rating: 4, comment: "Las mancuernas son pesadas y bien acabadas. Buen precio comparado con otras tiendas.", created_at: "2025-06-08T08:00:00Z", profiles: { name: "Laura Jiménez", avatar_url: undefined } },
];

// ─── STATS DEMO ───────────────────────────────────────────────────────────────

export const DEMO_STATS = {
  products: 4,
  coupons: 2,
  reviews: 89,
  redemptions: 29,
  rating_avg: 4.7,
  rating_count: 89,
};

// ─── 20 TIENDAS NUEVAS ────────────────────────────────────────────────────────

const D = "2025-01-01T00:00:00Z";

export const DEMO_BUSINESSES_EXTRA: Business[] = [
  { id: "demo-optica",       owner_id: "x1",  name: "Óptica Visión Clara",            description: "Lentes oftálmicos, solares y de contacto. Exámenes de la vista incluidos con cualquier compra de armazón.", category: "Otro",            address: "Calle Hidalgo 45, Centro, Acámbaro, Gto.",           latitude: 20.0326, longitude: -100.7282, whatsapp: "4181000001", image_url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 73,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-floristeria",  owner_id: "x2",  name: "Floristería Las Margaritas",     description: "Ramos, arreglos para bodas, XV años y condolencias. Flores frescas diariamente. Entrega a domicilio en Acámbaro.", category: "Otro",            address: "Av. Morelos 203, Centro, Acámbaro, Gto.",            latitude: 20.0312, longitude: -100.7291, whatsapp: "4181000002", image_url: "https://images.unsplash.com/photo-1512056495345-913a0c261dc8?w=800&q=80", banner_url: undefined, rating_avg: 4.9, rating_count: 112, is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-abarrotes",    owner_id: "x4",  name: "Abarrotes La Esquina",           description: "Todo lo que necesitas para el hogar. Abarrotes, limpieza, bebidas, botanas y artículos de primera necesidad.", category: "Abarrotes",       address: "Calle Matamoros 12, Col. Centro, Acámbaro, Gto.",    latitude: 20.0298, longitude: -100.7278, whatsapp: "4181000004", image_url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80", banner_url: undefined, rating_avg: 4.5, rating_count: 87,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-jugueteria",   owner_id: "x5",  name: "Juguetería El Principito",       description: "Juguetes educativos, muñecas, carros, juegos de mesa y artículos de temporada. El lugar favorito de los niños.", category: "Juguetería",      address: "Av. Juárez 123, Centro, Acámbaro, Gto.",             latitude: 20.0342, longitude: -100.7248, whatsapp: "4181000005", image_url: "https://images.unsplash.com/photo-1758094651718-966c759fae0d?w=800&q=80", banner_url: undefined, rating_avg: 4.7, rating_count: 65,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-libreria",     owner_id: "x6",  name: "Librería Cultura",               description: "Libros de texto, novelas, cómics, revistas y artículos de papelería fina. Sección infantil y universitaria.", category: "Librería",        address: "Plaza Principal s/n, Centro, Acámbaro, Gto.",        latitude: 20.0320, longitude: -100.7270, whatsapp: "4181000006", image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 91,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-relojeria",    owner_id: "x7",  name: "Relojería y Bisutería del Tiempo", description: "Relojes para hombre y dama, pulseras, cadenas y reparación de relojes. Marcas reconocidas y bisutería fina.", category: "Joyería",         address: "Calle Morelos 33, Centro, Acámbaro, Gto.",           latitude: 20.0308, longitude: -100.7285, whatsapp: "4181000007", image_url: "https://images.unsplash.com/photo-1615368144592-44708889c926?w=800&q=80", banner_url: undefined, rating_avg: 4.7, rating_count: 58,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-musica",       owner_id: "x8",  name: "Música y Sonido Acámbaro",       description: "Guitarras, teclados, baterías, micrófonos y equipos de sonido profesional. Clases de música disponibles.", category: "Electrónica",     address: "Blvd. Revolución 55, Acámbaro, Gto.",                latitude: 20.0335, longitude: -100.7240, whatsapp: "4181000008", image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 44,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-computacion",  owner_id: "x9",  name: "Computación Pro TechCenter",     description: "Laptops, computadoras de escritorio, impresoras, componentes y servicio técnico especializado en Acámbaro.", category: "Electrónica",     address: "Av. Tecnológico 78, Acámbaro, Gto.",                 latitude: 20.0345, longitude: -100.7232, whatsapp: "4181000009", image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80", banner_url: undefined, rating_avg: 4.6, rating_count: 79,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-herbolaria",   owner_id: "x10", name: "Herbolaria y Naturista Verde",   description: "Hierbas medicinales, tés, aceites esenciales, suplementos naturales y productos sin químicos. Asesoría personalizada.", category: "Farmacia",        address: "Calle 5 de Mayo 15, Centro, Acámbaro, Gto.",         latitude: 20.0304, longitude: -100.7296, whatsapp: "4181000010", image_url: "https://images.unsplash.com/photo-1566792505656-e82d93abac30?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 102, is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-uniformes",    owner_id: "x11", name: "Uniformes y Bordados Acámbaro",  description: "Uniformes escolares, empresariales e industriales con bordado personalizado. Entrega en 3 días hábiles.", category: "Tienda de ropa",  address: "Av. Juárez 200, Acámbaro, Gto.",                     latitude: 20.0350, longitude: -100.7250, whatsapp: "4181000011", image_url: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80", banner_url: undefined, rating_avg: 4.6, rating_count: 55,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-bicicletas",   owner_id: "x12", name: "Bicicletas y Sport Plus",        description: "Bicicletas de montaña, urbanas y de ruta. Accesorios, refacciones y taller de reparación en el mismo lugar.", category: "Deportes",        address: "Carr. Acámbaro-Uriangato Km 2, Acámbaro, Gto.",     latitude: 20.0285, longitude: -100.7215, whatsapp: "4181000012", image_url: "https://images.unsplash.com/photo-1768161680532-32d02decbcb4?w=800&q=80", banner_url: undefined, rating_avg: 4.7, rating_count: 68,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-tapiceria",    owner_id: "x13", name: "Tapicería y Cortinas El Arte",   description: "Tapizado de muebles, cortinas a medida, persianas y cojines decorativos. Telas importadas y nacionales.", category: "Mueblería",       address: "Calle Aldama 155, Acámbaro, Gto.",                   latitude: 20.0292, longitude: -100.7300, whatsapp: "4181000013", image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 39,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-movilfix",     owner_id: "x15", name: "Celulares y Reparación MovilFix", description: "Venta de celulares, accesorios y reparación express de pantallas, baterías y software. Garantía en todos los servicios.", category: "Electrónica",     address: "Blvd. Revolución 140, Acámbaro, Gto.",               latitude: 20.0325, longitude: -100.7238, whatsapp: "4181000015", image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80", banner_url: undefined, rating_avg: 4.6, rating_count: 126, is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-petcare",      owner_id: "x16", name: "Veterinaria y Clínica PetCare",  description: "Consultas, vacunas, cirugías y grooming para perros y gatos. Médico veterinario certificado. Urgencias disponibles.", category: "Mascotas",        address: "Av. Tecnológico 22, Acámbaro, Gto.",                 latitude: 20.0358, longitude: -100.7244, whatsapp: "4181000016", image_url: "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800&q=80", banner_url: undefined, rating_avg: 4.9, rating_count: 87,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-ninos",        owner_id: "x17", name: "Ropa Infantil Pequeños Gigantes", description: "Ropa para bebés, niñas y niños de 0 a 14 años. Moda infantil con las mejores marcas y telas suaves e hipoalergénicas.", category: "Tienda de ropa",  address: "Calle Aldama 88, Centro, Acámbaro, Gto.",            latitude: 20.0316, longitude: -100.7256, whatsapp: "4181000017", image_url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 96,  is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-estetica",     owner_id: "x18", name: "Salón y Estética Glamour",       description: "Corte, tinte, keratina, uñas, maquillaje y tratamientos faciales. Estilistas profesionales certificadas.", category: "Cosméticos",      address: "Av. Morelos 156, Centro, Acámbaro, Gto.",            latitude: 20.0302, longitude: -100.7267, whatsapp: "4181000018", image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80", banner_url: undefined, rating_avg: 4.8, rating_count: 174, is_approved: true, is_active: true, created_at: D, updated_at: D },
  { id: "demo-cristaleria",  owner_id: "x19", name: "Cristalería y Vidrios Acámbaro", description: "Vidrio templado, cristales decorativos, espejos a medida, vitrales y vidrio para ventanas y puertas.", category: "Otro",            address: "Carr. Acámbaro-Morelia Km 0.5, Acámbaro, Gto.",     latitude: 20.0288, longitude: -100.7225, whatsapp: "4181000019", image_url: "https://images.unsplash.com/photo-1513716875652-59c99449ee70?w=800&q=80", banner_url: undefined, rating_avg: 4.6, rating_count: 42,  is_approved: true, is_active: true, created_at: D, updated_at: D },
];

// ─── PRODUCTOS TIENDAS NUEVAS ─────────────────────────────────────────────────

export const DEMO_PRODUCTS_OPTICA: Product[] = [
  { id: "op1", business_id: "demo-optica", name: "Armazón Acetato Redondo", description: "Marco de acetato premium, varios colores, incluye estuche y paño", price: 890, image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "op2", business_id: "demo-optica", name: "Lentes Solares Polarizados UV400", description: "Protección 100% UV, filtro polarizado, armazón ligero", price: 650, image_url: "https://images.unsplash.com/photo-1566421966482-ad8076104d8e?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "op3", business_id: "demo-optica", name: "Lentes de Contacto Mensuales (par)", description: "Contactos de hidrogel, alta permeabilidad al oxígeno, 3 pares", price: 480, image_url: "https://images.unsplash.com/photo-1573207185685-5109f337fdf6?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "op4", business_id: "demo-optica", name: "Armazón Titanio Ejecutivo", description: "Ultraligero, hipoalergénico, corte recto para uso profesional", price: 1200, image_url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_FLORISTERIA: Product[] = [
  { id: "fl1", business_id: "demo-floristeria", name: "Ramo de Rosas Rojas (12 pzas)", description: "Rosas frescas importadas, cortadas el mismo día, base y moño incluidos", price: 380, image_url: "https://images.unsplash.com/photo-1512056495345-913a0c261dc8?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "fl2", business_id: "demo-floristeria", name: "Arreglo Floral de Bodas", description: "Composición con lilies, rosas y follaje, personalizable en colores", price: 1200, image_url: "https://images.unsplash.com/photo-1521520368710-3ab197656d60?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "fl3", business_id: "demo-floristeria", name: "Planta Suculenta en Maceta", description: "Suculenta en maceta de cerámica pintada, ideal para regalo o decoración", price: 120, image_url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "fl4", business_id: "demo-floristeria", name: "Centro de Mesa XV Años", description: "Arreglo elaborado con flores de temporada, varita de cala y paniculata", price: 850, image_url: "https://images.unsplash.com/photo-1512056495345-913a0c261dc8?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_ABARROTES: Product[] = [
  { id: "ab1", business_id: "demo-abarrotes", name: "Papel Higiénico Suave 12 Rollos", description: "Doble hoja, alta absorción, paquete familiar para el hogar", price: 145, image_url: "https://images.unsplash.com/photo-1699377179823-d5975d237b4e?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ab2", business_id: "demo-abarrotes", name: "Detergente en Polvo 4kg", description: "Fórmula concentrada para ropa blanca y de color, aroma fresco de larga duración", price: 165, image_url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ab3", business_id: "demo-abarrotes", name: "Kit Limpieza del Hogar (6 pzas)", description: "Jabón de trastos, quitagrasas, limpiador multiusos, cloro y zacate", price: 145, image_url: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ab4", business_id: "demo-abarrotes", name: "Pilas Alcalinas AA (8 pzas)", description: "Baterías de larga duración, ideales para juguetes, controles y linternas", price: 95, image_url: "https://images.unsplash.com/photo-1591964006776-90b32e88f5ec?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_JUGUETERIA: Product[] = [
  { id: "ju1", business_id: "demo-jugueteria", name: "Set de Construcción 200 pzas", description: "Bloques de plástico de colores, compatibles con marcas reconocidas, niños 5-12 años", price: 450, image_url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ju2", business_id: "demo-jugueteria", name: "Muñeca con Accesorios", description: "Muñeca de 30cm con 12 accesorios intercambiables, cabello peinable", price: 280, image_url: "https://images.unsplash.com/photo-1758919005125-363f7be78139?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ju3", business_id: "demo-jugueteria", name: "Juego de Mesa Familiar", description: "Juego didáctico para 2-6 jugadores, preguntas y retos, apto desde 8 años", price: 320, image_url: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ju4", business_id: "demo-jugueteria", name: "Carro de Control Remoto 4x4", description: "Camioneta RC recargable, velocidad máx 25 km/h, todo terreno", price: 680, image_url: "https://images.unsplash.com/photo-1650694992711-fa7f9b204ae6?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_LIBRERIA: Product[] = [
  { id: "li1", business_id: "demo-libreria", name: "Pack Libros de Texto SEP", description: "Libros de texto para primaria completa, edición SEP actualizada 2025", price: 380, image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "li2", business_id: "demo-libreria", name: "Novela Bestseller Nacional", description: "Selección de novelas de autores mexicanos contemporáneos, pasta blanda", price: 180, image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "li3", business_id: "demo-libreria", name: "Plumas Mont Blanc Style (2 pzas)", description: "Plumas de gel premium, punta 0.5mm, escritura suave, azul y negro", price: 95, image_url: "https://images.unsplash.com/photo-1510936994138-07e06c7c5add?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "li4", business_id: "demo-libreria", name: "Cuaderno de Dibujo Profesional", description: "Papel grueso 200g, 50 hojas, ideal para acuarela, lápiz y bolígrafo", price: 120, image_url: "https://images.unsplash.com/photo-1495232416988-d26458b7a5fb?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_RELOJERIA: Product[] = [
  { id: "re1", business_id: "demo-relojeria", name: "Reloj Acero Hombre Clásico", description: "Movimiento japonés, correa de acero inoxidable, resistente al agua 50m", price: 1450, image_url: "https://images.unsplash.com/photo-1615368144592-44708889c926?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "re2", business_id: "demo-relojeria", name: "Reloj Dama Brillantes", description: "Esfera con 12 cristales Swarovski, brazalete de acero dorado, 3 colores", price: 980, image_url: "https://images.unsplash.com/photo-1703034390224-f5f0a204abc7?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "re3", business_id: "demo-relojeria", name: "Pulsera Acero Milanesa", description: "Malla de acero inoxidable magnética, talla ajustable, unisex", price: 320, image_url: "https://images.unsplash.com/photo-1585679212204-355a6966bf9a?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "re4", business_id: "demo-relojeria", name: "Reloj de Pared Moderno", description: "Diseño minimalista, movimiento silencioso, diámetro 35cm, madera y metal", price: 450, image_url: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_MUSICA: Product[] = [
  { id: "mu1", business_id: "demo-musica", name: "Guitarra Acústica Principiante", description: "Cuerpo de tilo, mástil de arce, cuerdas de acero, incluye funda y pua", price: 1850, image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "mu2", business_id: "demo-musica", name: "Teclado Digital 61 Teclas", description: "Con sensibilidad al tacto, 100 sonidos, conectividad USB y MIDI", price: 3200, image_url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "mu3", business_id: "demo-musica", name: "Micrófono Dinámico Pro", description: "Cardioide, conector XLR, respuesta de frecuencia plana, para karaoke y estudio", price: 890, image_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "mu4", business_id: "demo-musica", name: "Bocina PA 12\" 400W", description: "Bocina de piso pasiva, tweeter integrado, alta fidelidad para eventos", price: 4500, image_url: "https://images.unsplash.com/photo-1517756548657-b2c24162e63d?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_COMPUTACION: Product[] = [
  { id: "cp1", business_id: "demo-computacion", name: "Laptop 15\" Core i5 8GB RAM", description: "Procesador Intel Core i5-12va gen, SSD 256GB, pantalla Full HD, Win 11", price: 12500, image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "cp2", business_id: "demo-computacion", name: "Mouse Inalámbrico Ergonómico", description: "Receptor USB, 1600 DPI, diseño vertical antifatiga, batería AA incluida", price: 380, image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "cp3", business_id: "demo-computacion", name: "Teclado Mecánico RGB", description: "Switches Blue, retroiluminación 16M colores, full-size, USB tipo C", price: 950, image_url: "https://images.unsplash.com/photo-1626958390898-162d3577f293?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "cp4", business_id: "demo-computacion", name: "Monitor 24\" Full HD IPS", description: "Resolución 1920x1080, tiempo respuesta 5ms, 75Hz, entrada HDMI y VGA", price: 3800, image_url: "https://images.unsplash.com/photo-1547119957-637f8679db1e?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_HERBOLARIA: Product[] = [
  { id: "he1", business_id: "demo-herbolaria", name: "Té Herbal Relajante (30 sobres)", description: "Mezcla de manzanilla, tila y valeriana, sin cafeína, orgánico certificado", price: 95, image_url: "https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "he2", business_id: "demo-herbolaria", name: "Aceite Esencial Lavanda 30ml", description: "100% puro y natural, destilado al vapor, apto para difusor y uso tópico", price: 180, image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "he3", business_id: "demo-herbolaria", name: "Crema Corporal Natural de Aloe", description: "Sin parabenos ni colorantes, hidratación profunda, 250ml", price: 145, image_url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "he4", business_id: "demo-herbolaria", name: "Cápsulas Magnesio 500mg (60 caps)", description: "Suplemento de magnesio quelado, reduce calambres y mejora el sueño", price: 220, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_UNIFORMES: Product[] = [
  { id: "un1", business_id: "demo-uniformes", name: "Uniforme Escolar Completo", description: "Playera tipo polo, pantalón o falda y calcetines. Tallas 2 a 18 años", price: 350, image_url: "https://images.unsplash.com/photo-1578826334149-30cc680eb9d9?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "un2", business_id: "demo-uniformes", name: "Camisa Corporativa Bordada", description: "Polo piqué 65% poliéster, bordado de logotipo incluido, 10 colores disponibles", price: 280, image_url: "https://images.unsplash.com/photo-1624471621620-c30f427546ce?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "un3", business_id: "demo-uniformes", name: "Overol Industrial Naranja", description: "Tela resistente 100% algodón, tiras reflectantes, bolsillos multifuncionales", price: 520, image_url: "https://images.unsplash.com/photo-1642356988913-52bf0a17d930?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "un4", business_id: "demo-uniformes", name: "Gorra Publicitaria con Bordado", description: "Gorra de 6 paneles, broche metálico ajustable, bordado en frente", price: 120, image_url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_BICICLETAS: Product[] = [
  { id: "bi1", business_id: "demo-bicicletas", name: "Bicicleta Montaña 21 Velocidades", description: "Cuadro de aluminio, frenos de disco, llantas 26\", cambios Shimano", price: 4800, image_url: "https://images.unsplash.com/photo-1768161680532-32d02decbcb4?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "bi2", business_id: "demo-bicicletas", name: "Casco Ciclismo Certificado", description: "Certificación CE, 20 ventilaciones, visera ajustable, talla S/M/L", price: 450, image_url: "https://images.unsplash.com/photo-1591511275477-88f079d88154?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "bi3", business_id: "demo-bicicletas", name: "Kit de Reparación de Llanta", description: "Parches vulcanizables, pegamento, palancas y miniinflador incluidos", price: 95, image_url: "https://images.unsplash.com/photo-1569584437478-412c917b487c?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "bi4", business_id: "demo-bicicletas", name: "Luces LED Bicicleta (delantera + trasera)", description: "Recargables por USB, 3 modos de luz, resistentes al agua", price: 220, image_url: "https://images.unsplash.com/photo-1602667341932-6e6404cd20ba?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_TAPICERIA: Product[] = [
  { id: "ta1", business_id: "demo-tapiceria", name: "Sofá 3 Plazas Tapizado Tela", description: "Marco madera pino, espuma alta densidad, tela antimanchas, 8 colores", price: 5800, image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ta2", business_id: "demo-tapiceria", name: "Cortinas Blackout 2.5m Par", description: "Tela opaca 100%, bloquea luz y ruido, ancho 1.40m cada pieza, 12 colores", price: 680, image_url: "https://images.unsplash.com/photo-1616046386594-c152babc9e15?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ta3", business_id: "demo-tapiceria", name: "Set Cojines Decorativos (4 pzas)", description: "Relleno de fibra siliconada, funda de lino, 45x45cm, varios diseños", price: 320, image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ta4", business_id: "demo-tapiceria", name: "Persiana Enrollable Blackout", description: "Mecanismo de cadena, instalación sencilla, ancho 120cm, 6 colores", price: 450, image_url: "https://images.unsplash.com/photo-1663942734862-e256b65b7c68?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_MOVILFIX: Product[] = [
  { id: "mf1", business_id: "demo-movilfix", name: "Reparación de Pantalla iPhone", description: "Cambio de pantalla OLED original, incluye garantía de 3 meses. Entrega en 2 horas", price: 1200, image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "mf2", business_id: "demo-movilfix", name: "Batería de Repuesto Samsung", description: "Batería compatible con modelos Galaxy S, A y J, 100% nueva con garantía", price: 380, image_url: "https://images.unsplash.com/photo-1512439408685-2e399291a4e6?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "mf3", business_id: "demo-movilfix", name: "Funda Personalizada con Foto", description: "Funda rígida con imagen personalizada, compatible con todos los modelos actuales", price: 180, image_url: "https://images.unsplash.com/photo-1623393835885-560a7c576aa2?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "mf4", business_id: "demo-movilfix", name: "Vidrio Templado 9H (2 pzas)", description: "Protector de pantalla HD, dureza 9H, incluye kit de limpieza e instalación", price: 95, image_url: "https://images.unsplash.com/photo-1694278964421-b5e186bbc187?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_PETCARE: Product[] = [
  { id: "pc1", business_id: "demo-petcare", name: "Consulta Veterinaria General", description: "Revisión física completa, diagnóstico y receta médica. Previa cita o urgencias", price: 250, image_url: "https://images.unsplash.com/photo-1644675272883-0c4d582528d8?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "pc2", business_id: "demo-petcare", name: "Vacuna Triple Felina", description: "Vacuna para gatos contra rinotraqueítis, calicivirus y panleucopenia", price: 180, image_url: "https://images.unsplash.com/photo-1654895622553-cf4a29be9499?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "pc3", business_id: "demo-petcare", name: "Collar Antipulgas y Garrapatas 8 meses", description: "Collar de acción continua, resistente al agua, talla S/M/L para perros", price: 280, image_url: "https://images.unsplash.com/photo-1491545437994-ebc9551b87d7?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "pc4", business_id: "demo-petcare", name: "Shampoo Medicado para Perros 500ml", description: "Fórmula antifúngica y antibacteriana, suaviza el pelo y elimina olores", price: 145, image_url: "https://images.unsplash.com/photo-1647002380358-fc70ed2f04e0?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_NINOS: Product[] = [
  { id: "ni1", business_id: "demo-ninos", name: "Conjunto Casual Niño 2-8 años", description: "Playera y short de algodón orgánico, colores vibrantes, lavable a máquina", price: 280, image_url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ni2", business_id: "demo-ninos", name: "Vestido Fiesta Niña 3-10 años", description: "Tul y encaje, varios colores, lazo en la espalda, tallas 3 a 10 años", price: 450, image_url: "https://images.unsplash.com/photo-1652501025921-01c65e754b68?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ni3", business_id: "demo-ninos", name: "Tenis Escolar Niños Velcro", description: "Suela antiderrapante, cierre de velcro, tallas 14-22, negro y blanco", price: 320, image_url: "https://images.unsplash.com/photo-1725271741195-f627c9ef84ec?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "ni4", business_id: "demo-ninos", name: "Pijama Polar Infantil (camisa y pantalon)", description: "100% poliéster suave, estampados de personajes, tallas 2-14 años", price: 220, image_url: "https://images.unsplash.com/photo-1661966893934-682406391c5e?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_ESTETICA: Product[] = [
  { id: "es1", business_id: "demo-estetica", name: "Coloración Completa + Corte", description: "Tinte profesional, decoloración o baño de color + corte a elección. Resultado garantizado", price: 580, image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "es2", business_id: "demo-estetica", name: "Manicure y Pedicure Completo", description: "Limpieza, forma, cutícula, esmalte semipermanente en manos y pies", price: 320, image_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "es3", business_id: "demo-estetica", name: "Tratamiento Facial Hidratante", description: "Limpieza profunda, exfoliación, mascarilla y sérum de vitamina C. Duración 60 min", price: 480, image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "es4", business_id: "demo-estetica", name: "Keratina Alisante Profesional", description: "Alisado de hasta 4 meses, sin formaldehído, aplica en cabello natural y teñido", price: 850, image_url: "https://images.unsplash.com/photo-1780504542350-5078d4080081?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_PRODUCTS_CRISTALERIA: Product[] = [
  { id: "cr1", business_id: "demo-cristaleria", name: "Espejo Decorativo Redondo 80cm", description: "Marco de madera natural, biselado, colgante, ideal para sala o recámara", price: 1200, image_url: "https://images.unsplash.com/photo-1513716875652-59c99449ee70?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "cr2", business_id: "demo-cristaleria", name: "Florero de Cristal Soplado", description: "Florero artesanal soplado a mano, diseño asimétrico moderno, 30cm altura", price: 380, image_url: "https://images.unsplash.com/photo-1583303515365-cc4731ad721a?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "cr3", business_id: "demo-cristaleria", name: "Vidrio Templado para Baño 6mm", description: "Corte a medida, borde pulido, para mampara de regadera o ventana, hasta 1.5m²", price: 1800, image_url: "https://images.unsplash.com/photo-1571781418606-70265b9cce90?w=400&q=80", is_available: true, created_at: D, updated_at: D },
  { id: "cr4", business_id: "demo-cristaleria", name: "Set Copas de Vino Cristal (6 pzas)", description: "Cristal de borosilicato, 350ml capacidad, apto para lavavajillas", price: 480, image_url: "https://images.unsplash.com/photo-1571163940357-8b2ede0bf787?w=400&q=80", is_available: true, created_at: D, updated_at: D },
];

export const DEMO_ALL_PRODUCTS: Product[] = [
  ...DEMO_PRODUCTS, ...DEMO_PRODUCTS_ROPA, ...DEMO_PRODUCTS_ZAPATERIA,
  ...DEMO_PRODUCTS_ELECTRONICA, ...DEMO_PRODUCTS_JOYERIA, ...DEMO_PRODUCTS_FARMACIA,
  ...DEMO_PRODUCTS_COSMETICOS, ...DEMO_PRODUCTS_PETSHOP, ...DEMO_PRODUCTS_PAPELERIA,
  ...DEMO_PRODUCTS_MUEBLES, ...DEMO_PRODUCTS_ARTESANIAS, ...DEMO_PRODUCTS_DEPORTES,
  ...DEMO_PRODUCTS_OPTICA, ...DEMO_PRODUCTS_FLORISTERIA,
  ...DEMO_PRODUCTS_ABARROTES, ...DEMO_PRODUCTS_JUGUETERIA, ...DEMO_PRODUCTS_LIBRERIA,
  ...DEMO_PRODUCTS_RELOJERIA, ...DEMO_PRODUCTS_MUSICA, ...DEMO_PRODUCTS_COMPUTACION,
  ...DEMO_PRODUCTS_HERBOLARIA, ...DEMO_PRODUCTS_UNIFORMES, ...DEMO_PRODUCTS_BICICLETAS,
  ...DEMO_PRODUCTS_TAPICERIA, ...DEMO_PRODUCTS_MOVILFIX,
  ...DEMO_PRODUCTS_PETCARE, ...DEMO_PRODUCTS_NINOS, ...DEMO_PRODUCTS_ESTETICA,
  ...DEMO_PRODUCTS_CRISTALERIA,
];

export const DEMO_ALL_BUSINESSES_LIST = [...DEMO_BUSINESSES, ...DEMO_BUSINESSES_EXTRA];

export interface ProductExtra {
  original_price?: number;
  images: string[];
  condition: "Nuevo" | "Como nuevo" | "Usado";
  stock: number;
  features: string[];
}

export const DEMO_PRODUCT_EXTRAS: Record<string, ProductExtra> = {
  p1: {
    original_price: 1099,
    images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80", "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80", "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80"],
    condition: "Nuevo", stock: 12,
    features: ["Potencia: 750 W", "Mandril: 1/2\" (13 mm)", "Velocidad variable: 0-3,000 RPM", "Reversa incluida", "Incluye maletín de transporte"],
  },
  r1: {
    original_price: 250,
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80", "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80"],
    condition: "Nuevo", stock: 45,
    features: ["100% algodón peinado", "Tallas: XS, S, M, L, XL, XXL", "12 colores disponibles", "Lavable a máquina en frío", "Cuello redondo reforzado"],
  },
  e1: {
    original_price: 999,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&q=80", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80"],
    condition: "Nuevo", stock: 8,
    features: ["Cancelación activa de ruido (ANC)", "Batería: hasta 30 horas", "Bluetooth 5.0", "Diseño plegable y portátil", "Sonido HD con bajos profundos"],
  },
  z1: {
    original_price: 850,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80", "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80"],
    condition: "Nuevo", stock: 20,
    features: ["Suela amortiguada para running", "Material mesh transpirable", "Tallas 25 al 30 MX", "Unisex", "Suela antideslizante"],
  },
  j1: {
    original_price: 550,
    images: ["https://images.unsplash.com/photo-1580461118826-91da2d5cf0ea?w=800&q=80", "https://images.unsplash.com/photo-1623052619099-eab4a7ec273b?w=800&q=80", "https://images.unsplash.com/photo-1623303179820-de8ec58b03dc?w=800&q=80"],
    condition: "Nuevo", stock: 15,
    features: ["Plata 925 certificada", "Perla cultivada de agua dulce 8mm", "Cierre de rosca hipoalergénico", "Incluye caja de regalo", "Garantía de autenticidad"],
  },
  e4: {
    original_price: 1599,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80", "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80"],
    condition: "Nuevo", stock: 5,
    features: ["Monitor cardíaco 24/7", "GPS integrado", "Pantalla AMOLED 1.4\"", "Resistente al agua 5ATM", "Batería: 14 días en modo estándar"],
  },
  a1: {
    images: ["https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80", "https://images.unsplash.com/photo-1619400131077-bbdefafeae75?w=800&q=80", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],
    condition: "Nuevo", stock: 7,
    features: ["Pieza artesanal única", "Barro negro modelado a mano", "Altura: 20 cm aprox.", "Técnicas tradicionales locales", "Sellada con barniz protector"],
  },
  d1: {
    original_price: 420,
    images: ["https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=80", "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"],
    condition: "Nuevo", stock: 18,
    features: ["Talla oficial #5", "Cubierta PVC termosoldada", "Vejiga de látex alta retención", "Apto para cancha y pasto", "Peso reglamentario 410-450g"],
  },
  cp1: {
    original_price: 14999,
    images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80"],
    condition: "Nuevo", stock: 4,
    features: ["Intel Core i5 12va gen", "RAM 8GB DDR4 ampliable a 16GB", "SSD 256GB", "Pantalla Full HD 15.6\" IPS", "Windows 11 Home activado"],
  },
  fl1: {
    original_price: 480,
    images: ["https://images.unsplash.com/photo-1512056495345-913a0c261dc8?w=800&q=80", "https://images.unsplash.com/photo-1439122955805-cbac26b73f3b?w=800&q=80", "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=800&q=80"],
    condition: "Nuevo", stock: 10,
    features: ["12 rosas importadas frescas", "Cortadas el mismo día", "Base de agua con follaje incluida", "Moño decorativo incluido", "Entrega a domicilio en Acámbaro"],
  },
};

// ─── CUPONES TIENDAS NUEVAS ───────────────────────────────────────────────────

export const DEMO_COUPONS_EXTRA: Coupon[] = [
  { id: "cx1",  business_id: "demo-optica",      title: "Examen de vista gratis con armazón", description: "Compra cualquier armazón y el examen de la vista es sin costo.", discount_type: "percent", value: 100, code: "ACAM-OPTICA",   qr_data: JSON.stringify({ coupon_code: "ACAM-OPTICA",   business_id: "demo-optica" }),      limit_count: 30, used_count: 4,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx2",  business_id: "demo-floristeria", title: "20% en ramos más de $300",            description: "Descuento en ramos de temporada y arreglos especiales.",        discount_type: "percent", value: 20, code: "ACAM-FLORES",  qr_data: JSON.stringify({ coupon_code: "ACAM-FLORES",  business_id: "demo-floristeria" }), limit_count: 50, used_count: 12, expires_at: "2026-10-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx4",  business_id: "demo-abarrotes",   title: "5% en despensa mayor a $200",         description: "Aplica en toda la tienda, presentando este cupón en caja.",      discount_type: "percent", value: 5,  code: "ACAM-TIENDA", qr_data: JSON.stringify({ coupon_code: "ACAM-TIENDA", business_id: "demo-abarrotes" }),   limit_count: 100, used_count: 33, expires_at: "2026-09-30T23:59:59Z", is_active: true, created_at: D },
  { id: "cx5",  business_id: "demo-jugueteria",  title: "15% en juguetes más de $400",         description: "Descuento en toda la línea de juguetes educativos y de acción.", discount_type: "percent", value: 15, code: "ACAM-TOY",   qr_data: JSON.stringify({ coupon_code: "ACAM-TOY",   business_id: "demo-jugueteria" }),  limit_count: 40, used_count: 9,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx6",  business_id: "demo-libreria",    title: "$30 en compras de libros",             description: "Válido en novelas, libros de texto y literatura infantil.",       discount_type: "fixed",   value: 30, code: "ACAM-LIBRO",  qr_data: JSON.stringify({ coupon_code: "ACAM-LIBRO",  business_id: "demo-libreria" }),    limit_count: 60, used_count: 18, expires_at: "2026-11-30T23:59:59Z", is_active: true, created_at: D },
  { id: "cx7",  business_id: "demo-relojeria",   title: "10% en relojes de más de $800",       description: "Descuento aplicable en relojes análogos y digitales.",          discount_type: "percent", value: 10, code: "ACAM-RELOJ",  qr_data: JSON.stringify({ coupon_code: "ACAM-RELOJ",  business_id: "demo-relojeria" }),   limit_count: 25, used_count: 6,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx8",  business_id: "demo-musica",      title: "$200 en instrumentos más de $2,000",  description: "Aplica en guitarras, teclados y percusiones.",                   discount_type: "fixed",   value: 200, code: "ACAM-MUSIC", qr_data: JSON.stringify({ coupon_code: "ACAM-MUSIC", business_id: "demo-musica" }),      limit_count: 20, used_count: 5,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx9",  business_id: "demo-computacion", title: "5% en laptops y computadoras",        description: "Descuento en equipos de cómputo nuevos con garantía.",           discount_type: "percent", value: 5,  code: "ACAM-PC",    qr_data: JSON.stringify({ coupon_code: "ACAM-PC",    business_id: "demo-computacion" }), limit_count: 15, used_count: 3,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx10", business_id: "demo-herbolaria",  title: "2x1 en tés medicinales",              description: "Lleva dos cajas de té y paga solo una. Toda la línea.",          discount_type: "percent", value: 50, code: "ACAM-HERBA",  qr_data: JSON.stringify({ coupon_code: "ACAM-HERBA",  business_id: "demo-herbolaria" }),  limit_count: 50, used_count: 14, expires_at: "2026-10-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx11", business_id: "demo-uniformes",   title: "10% en uniformes desde 5 piezas",     description: "Descuento por volumen en uniformes escolares y empresariales.",   discount_type: "percent", value: 10, code: "ACAM-UNI",   qr_data: JSON.stringify({ coupon_code: "ACAM-UNI",   business_id: "demo-uniformes" }),   limit_count: 30, used_count: 8,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx12", business_id: "demo-bicicletas",  title: "$300 en bicicletas más de $3,000",    description: "Aplica en bicicletas de montaña y urbanas nuevas.",               discount_type: "fixed",   value: 300, code: "ACAM-BICI",  qr_data: JSON.stringify({ coupon_code: "ACAM-BICI",  business_id: "demo-bicicletas" }),  limit_count: 20, used_count: 4,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx13", business_id: "demo-tapiceria",   title: "15% en cortinas a la medida",         description: "Descuento en cortinas blackout y de tela, instalación incluida.", discount_type: "percent", value: 15, code: "ACAM-CORTINA", qr_data: JSON.stringify({ coupon_code: "ACAM-CORTINA", business_id: "demo-tapiceria" }), limit_count: 25, used_count: 7,  expires_at: "2026-11-30T23:59:59Z", is_active: true, created_at: D },
  { id: "cx15", business_id: "demo-movilfix",    title: "20% en reparación de pantallas",      description: "Descuento en cambio de pantalla de cualquier modelo de celular.", discount_type: "percent", value: 20, code: "ACAM-FIX",   qr_data: JSON.stringify({ coupon_code: "ACAM-FIX",   business_id: "demo-movilfix" }),    limit_count: 40, used_count: 16, expires_at: "2026-10-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx16", business_id: "demo-petcare",     title: "Consulta + vacuna con $50 OFF",       description: "Descuento en paquete consulta más vacuna anual para perros.",     discount_type: "fixed",   value: 50, code: "ACAM-VET",   qr_data: JSON.stringify({ coupon_code: "ACAM-VET",   business_id: "demo-petcare" }),     limit_count: 35, used_count: 10, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx17", business_id: "demo-ninos",       title: "15% en ropa infantil de temporada",   description: "Nueva colección verano. Aplica en conjunto, vestidos y pijamas.", discount_type: "percent", value: 15, code: "ACAM-KIDS",  qr_data: JSON.stringify({ coupon_code: "ACAM-KIDS",  business_id: "demo-ninos" }),       limit_count: 50, used_count: 19, expires_at: "2026-09-30T23:59:59Z", is_active: true, created_at: D },
  { id: "cx18", business_id: "demo-estetica",    title: "10% en servicios capilares",          description: "Descuento en coloración, keratina y tratamientos de cabello.",   discount_type: "percent", value: 10, code: "ACAM-GLAM",  qr_data: JSON.stringify({ coupon_code: "ACAM-GLAM",  business_id: "demo-estetica" }),    limit_count: 40, used_count: 15, expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
  { id: "cx19", business_id: "demo-cristaleria", title: "$100 en espejos decorativos",         description: "Aplica en espejos de más de $800 con instalación incluida.",      discount_type: "fixed",   value: 100, code: "ACAM-VIDRIO", qr_data: JSON.stringify({ coupon_code: "ACAM-VIDRIO", business_id: "demo-cristaleria" }), limit_count: 15, used_count: 3,  expires_at: "2026-12-31T23:59:59Z", is_active: true, created_at: D },
];

// ─── COLECCIONES GLOBALES ─────────────────────────────────────────────────────

export const DEMO_ALL_COUPONS: Coupon[] = [
  ...DEMO_COUPONS, ...DEMO_COUPONS_LAVADO, ...DEMO_COUPONS_CERRAJERO,
  ...DEMO_COUPONS_PINTOR, ...DEMO_COUPONS_SALON, ...DEMO_COUPONS_FARMACIA,
  ...DEMO_COUPONS_TALLER, ...DEMO_COUPONS_VETERINARIA, ...DEMO_COUPONS_PAPELERIA,
  ...DEMO_COUPONS_MUEBLES, ...DEMO_COUPONS_ARTESANIAS, ...DEMO_COUPONS_DEPORTES,
  ...DEMO_COUPONS_EXTRA,
];

export const DEMO_ALL_REVIEWS: Review[] = [
  ...DEMO_REVIEWS, ...DEMO_REVIEWS_LAVADO, ...DEMO_REVIEWS_CERRAJERO,
  ...DEMO_REVIEWS_PINTOR, ...DEMO_REVIEWS_SALON, ...DEMO_REVIEWS_FARMACIA,
  ...DEMO_REVIEWS_TALLER, ...DEMO_REVIEWS_VETERINARIA, ...DEMO_REVIEWS_PAPELERIA,
  ...DEMO_REVIEWS_MUEBLES, ...DEMO_REVIEWS_ARTESANIAS, ...DEMO_REVIEWS_DEPORTES,
];

// ─── CARRUSEL "MODA EN ACÁMBARO" ──────────────────────────────────────────────
// Ropa, calzado y accesorios de distintas tiendas, usado en el home y en las
// páginas de negocios de categoría "Tienda de ropa".
export const FEATURED_ROPA = [
  { ...DEMO_PRODUCTS_ROPA[0],   business_name: "Boutique Acámbaro",              business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
  { ...DEMO_PRODUCTS_ZAPATERIA[0], business_name: "Zapatería El Paso",           business_category: "Zapatería",      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { ...DEMO_PRODUCTS_ROPA[1],   business_name: "Boutique Acámbaro",              business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80" },
  { ...DEMO_PRODUCTS_NINOS[0],  business_name: "Ropa Infantil Pequeños Gigantes", business_category: "Tienda de ropa", image: DEMO_PRODUCTS_NINOS[0].image_url! },
  { ...DEMO_PRODUCTS_ROPA[2],   business_name: "Boutique Acámbaro",              business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80" },
  { ...DEMO_PRODUCTS_ZAPATERIA[1], business_name: "Zapatería El Paso",           business_category: "Zapatería",      image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80" },
  { ...DEMO_PRODUCTS_ROPA[3],   business_name: "Boutique Acámbaro",              business_category: "Tienda de ropa", image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80" },
  { ...DEMO_PRODUCTS_NINOS[1],  business_name: "Ropa Infantil Pequeños Gigantes", business_category: "Tienda de ropa", image: DEMO_PRODUCTS_NINOS[1].image_url! },
];
