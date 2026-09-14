"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface CategoryItem {
  name: string;
  image: string;
  desc: string;
}

function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <div className="relative w-52 flex-shrink-0 group card hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/50 dark:hover:bg-white/10 transition-all duration-200">
      <Link href={`/?category=${encodeURIComponent(item.name)}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={`Ver ${item.name}`} />
      <div className="p-4 pb-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors leading-tight block">{item.name}</span>
        <span className="text-xs text-slate-500 dark:text-gray-500 mt-0.5 block">{item.desc}</span>
      </div>
      <div className="relative h-28 overflow-hidden pointer-events-none">
        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-70 group-hover:opacity-90" />
      </div>
    </div>
  );
}

// Misma velocidad y mecanica que ProductsReel: auto-avance con
// requestAnimationFrame, se detiene mientras se toca/arrastra y retoma
// solo al soltar.
const AUTO_SCROLL_SPEED = 0.6;

export default function CategoriesReel({ items }: { items: CategoryItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
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
  }, []);

  const doubled = [...items, ...items];

  // No se captura el puntero en pointerdown: si se hiciera de inmediato,
  // hasta un simple clic secuestraría el evento hacia este contenedor y
  // nunca llegaría al Link de la categoría. Solo se activa el arrastre
  // (y ahí se captura el puntero) cuando el mouse se mueve más de un
  // pequeño umbral.
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

  return (
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
      <div className="flex gap-4 w-max">
        {doubled.map((item, i) => (
          <CategoryCard key={`${item.name}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
