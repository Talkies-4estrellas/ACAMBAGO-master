"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";

interface ReelItem {
  id: string;
  name: string;
  price: number;
  image: string;
  business_id: string;
  business_name: string;
  business_category: string;
  // Opcionales: no todas las pantallas que usan este carrusel los traen
  // todavia (algunas vienen de un RPC que solo se actualiza aparte). Sin
  // ellos, la tarjeta se comporta exactamente como antes (sin insignia).
  stock_quantity?: number | null;
  is_available?: boolean;
}

function ReelCard({ item, fixedWidth = true }: { item: ReelItem; fixedWidth?: boolean }) {
  const outOfStock = item.is_available === false || item.stock_quantity === 0;
  const lowStock = !outOfStock && item.stock_quantity != null && item.stock_quantity <= 5;

  return (
    <div className={`${fixedWidth ? "w-56 flex-shrink-0" : "w-full"} card group hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 dark:hover:bg-white/10 transition-all duration-200 relative flex flex-col`}>
      <div className="relative h-32 sm:h-44 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/50 dark:to-brand-800/50 overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {outOfStock && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Agotado</span>
          </div>
        )}
        {!item.business_id.startsWith("demo") && <FavoriteButton productId={item.id} />}
      </div>

      <div className={`p-3 sm:p-4 flex flex-col flex-1 ${outOfStock ? "opacity-60" : ""}`}>
        <p className="text-xs text-slate-500 dark:text-gray-500 mb-1 truncate">{item.business_name}</p>
        {/* min-h reserva el espacio de 2 líneas: sin esto, un título de una
            sola línea deja la tarjeta más baja que sus vecinas. */}
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">{item.name}</h3>
        {/* mt-auto fija el precio siempre al fondo de la tarjeta. Ya no hay
            "Agregar al carrito" aqui a proposito - el carrito es la ultima
            opcion de compra, no la primera; agregar al carrito solo se puede
            hacer desde la ficha del producto, no directo desde la tarjeta. */}
        <div className="flex items-center gap-2 mt-auto">
          <p className="text-brand-600 dark:text-brand-400 font-bold text-base">{formatPrice(item.price)}</p>
          {lowStock && (
            <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
              Últimas {item.stock_quantity}
            </span>
          )}
        </div>
      </div>

      {/* Enlace invisible que cubre toda la card excepto los botones (z-10) —
          va al final del JSX, no al principio, para pintar por encima de la
          foto: un div posicionado (la foto) que aparece después en el DOM
          que este mismo Link tapaba los clics aunque el Link tuviera
          "position: absolute" primero, por el orden de apilamiento. */}
      <Link
        href={`/product/${item.id}`}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`Ver ${item.name}`}
      />
    </div>
  );
}

// Con pocos productos, duplicarlos para el loop infinito se nota demasiado
// (el mismo producto aparece 2 veces en pantalla). Con este mínimo de
// productos, el scroll ya alcanza a disimular la repetición.
const MIN_ITEMS_FOR_LOOP = 5;

// Velocidad del auto-avance en px por frame (~60fps).
const AUTO_SCROLL_SPEED = 0.6;

const DEFAULT_GRID_COLS = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

// items?: Cuando es true (tiendas, real o demo), se muestran todos los
// productos en una cuadrícula fija, sin auto-scroll ni arrastre, como el
// listado de productos de un vendedor en Mercado Libre. El carrusel con
// auto-avance solo se usa en "Productos Destacados" del home.
// cols?: clases de columnas por breakpoint para el modo grid (por defecto
// DEFAULT_GRID_COLS); páginas con más espacio horizontal, como el catálogo
// completo, pueden pedir más columnas sin afectar a las demás pantallas
// que usan este mismo componente.
export default function ProductsReel({ items, grid = false, cols = DEFAULT_GRID_COLS }: { items: ReelItem[]; grid?: boolean; cols?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (grid || items.length < MIN_ITEMS_FOR_LOOP) return;
    const el = scrollerRef.current;
    if (!el) return;

    let rafId: number;
    const tick = () => {
      if (!pausedRef.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += AUTO_SCROLL_SPEED;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [items.length, grid]);

  if (grid || items.length < MIN_ITEMS_FOR_LOOP) {
    // El modo "grid" (tiendas) vive dentro de un contenedor que ya trae su
    // propio padding; el fallback de pocos items del carrusel del home
    // necesita su propio px-4 porque su sección es a sangre completa.
    return (
      <div className={`grid ${cols} gap-3 sm:gap-5 ${grid ? "" : "px-4"}`}>
        {items.map((item) => (
          <ReelCard key={item.id} item={item} fixedWidth={false} />
        ))}
      </div>
    );
  }

  const doubled = [...items, ...items];

  // El toque en móvil usa el scroll nativo (con inercia); solo el mouse en
  // desktop necesita el arrastre manual, ya que overflow-x-auto no se puede
  // "jalar" con click sostenido por sí solo.
  //
  // Importante: NO se captura el puntero en pointerdown. Si se hiciera de
  // inmediato, hasta un simple clic (sin arrastrar) secuestraría el evento
  // hacia este contenedor y el clic nunca llegaría al botón "Agregar al
  // carrito" ni al Link del producto. Solo se activa el arrastre (y recién
  // ahí se captura el puntero) cuando el mouse se mueve más de un pequeño
  // umbral; un clic normal nunca activa nada de esto.
  const DRAG_THRESHOLD = 6;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pausedRef.current = true;
    if (e.pointerType === "mouse" && scrollerRef.current) {
      dragStartX.current = e.clientX;
      dragStartScroll.current = scrollerRef.current.scrollLeft;
      pointerIdRef.current = e.pointerId;
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === null || !scrollerRef.current) return;
    const delta = e.clientX - dragStartX.current;
    if (!draggingRef.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      draggingRef.current = true;
      scrollerRef.current.setPointerCapture(pointerIdRef.current);
    }
    scrollerRef.current.scrollLeft = dragStartScroll.current - delta;
  };
  const endInteraction = () => {
    draggingRef.current = false;
    pointerIdRef.current = null;
    pausedRef.current = false;
  };

  // Mueve el reel un tramo (~1 tarjeta y media) al hacer clic en las flechas.
  // Pausa el auto-scroll mientras dura la animacion; si no, el loop de
  // requestAnimationFrame reescribe scrollLeft cada frame y cancela el
  // scroll suave casi de inmediato.
  const scrollByStep = (direction: 1 | -1) => {
    pausedRef.current = true;
    scrollerRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => { pausedRef.current = false; }, 600);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByStep(-1)}
        aria-label="Ver anteriores"
        className="hidden md:flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-md hover:bg-white/90 dark:hover:bg-black/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-white" />
      </button>
      <button
        type="button"
        onClick={() => scrollByStep(1)}
        aria-label="Ver más"
        className="hidden md:flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-md hover:bg-white/90 dark:hover:bg-black/60 transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-slate-700 dark:text-white" />
      </button>

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endInteraction}
        onPointerLeave={endInteraction}
        onPointerCancel={endInteraction}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={endInteraction}
        className="overflow-x-auto cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, white 8%, white 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, white 8%, white 92%, transparent)",
        }}
      >
        <div className="flex gap-5 w-max">
          {doubled.map((item, i) => (
            <ReelCard key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
