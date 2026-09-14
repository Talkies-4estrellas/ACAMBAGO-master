"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Ticket, MapPin, LayoutGrid,
  Package, Store, Clock, Coins, TrendingUp, Truck, Lock,
} from "lucide-react";
import { getRecentlyViewed, RecentlyViewedItem } from "@/lib/recently-viewed";
import { formatPrice } from "@/lib/utils";

const ITEMS = [
  { key: "cupones", icon: Ticket, title: "Cupones con QR", desc: "Descuentos exclusivos en tiendas locales", cta: "Ver cupones", href: "/coupons" },
  { key: "mapa", icon: MapPin, title: "Mapa interactivo", desc: "Encuentra negocios cerca de ti", cta: "Ver mapa", href: "/map" },
  { key: "categorias", icon: LayoutGrid, title: "Categorías", desc: "Explora por tipo de negocio", cta: "Ver categorías", href: "/categorias" },
  { key: "destacados", icon: Package, title: "Productos Destacados", desc: "Selección variada de las tiendas locales", cta: "Ver productos", href: "/productos" },
  { key: "publicar", icon: Store, title: "Publica tu tienda", desc: "Vende tus productos gratis en Acámbaro", cta: "Publicar tienda", href: "/perfil/crear-tienda" },
  { key: "recientes", icon: Clock, title: "Vistos recientemente", desc: "Los productos que viste en este navegador", cta: "Ver historial", href: "/vistos-recientemente" },
  { key: "baratos", icon: Coins, title: "Menos de $500", desc: "Productos con precios bajos", cta: "Mostrar productos", href: "/productos?sort=precio_asc" },
  { key: "vendidos", icon: TrendingUp, title: "Más vendidos", desc: "Ranking real por ventas de las tiendas", cta: "Ir a más vendidos", href: "/productos?sort=vendidos" },
  { key: "entrega", icon: Truck, title: "Entrega a domicilio", desc: "Muchos negocios entregan directo en Acámbaro", cta: "Ver tiendas", href: "/?delivery=domicilio" },
  { key: "pago", icon: Lock, title: "Pago seguro", desc: "Paga con Mercado Pago o tarjeta, protegido", cta: "Cómo funciona", href: "/pago-seguro" },
];

export default function QuickAccessRow() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [lastViewed, setLastViewed] = useState<RecentlyViewedItem | null>(null);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    queueMicrotask(() => {
      const viewed = getRecentlyViewed();
      if (viewed.length > 0) setLastViewed(viewed[0]);
      updateArrows();
    });
  }, []);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Ver anteriores"
          className="hidden md:flex absolute -left-4 top-[72px] z-10 w-9 h-9 rounded-full bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 shadow-md items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-gray-300" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
      >
        {ITEMS.map((item) => {
          const isRecent = item.key === "recientes";
          const showProduct = isRecent && lastViewed;
          const href = showProduct ? `/product/${lastViewed!.id}` : item.href;

          return (
            <Link
              key={item.key}
              href={href}
              className="flex-shrink-0 w-40 sm:w-44 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all"
            >
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.title}</p>

              {showProduct ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-white/5">
                  <Image src={lastViewed!.image} alt={lastViewed!.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                  <item.icon className="w-9 h-9 text-brand-600 dark:text-brand-400" />
                </div>
              )}

              {showProduct ? (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 dark:text-gray-300 leading-snug line-clamp-2">{lastViewed!.name}</p>
                  <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-1">{formatPrice(lastViewed!.price)}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-gray-400 leading-snug flex-1">{item.desc}</p>
              )}

              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 px-4 py-2 rounded-lg w-full">
                {showProduct ? "Ver de nuevo" : item.cta}
              </span>
            </Link>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          aria-label="Ver más"
          className="hidden md:flex absolute -right-4 top-[72px] z-10 w-9 h-9 rounded-full bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 shadow-md items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
}
