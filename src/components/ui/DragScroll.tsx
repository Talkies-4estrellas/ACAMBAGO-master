"use client";

import { useRef } from "react";

// Permite arrastrar con el mouse (click y arrastra) en listas horizontales;
// el swipe con el dedo en móvil ya funciona nativo gracias a overflow-x-auto.
//
// Importante: NO se captura el puntero en pointerdown. Si se hiciera de
// inmediato, hasta un simple clic (sin arrastrar) secuestraría el evento
// hacia este contenedor y el clic nunca llegaría al link/botón de adentro
// (mismo bug real que ya se había resuelto en ProductsReel.tsx). Solo se
// activa el arrastre, y recién ahí se captura el puntero, cuando el mouse
// se mueve más de un pequeño umbral.
const DRAG_THRESHOLD = 6;

export default function DragScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    startX.current = e.clientX;
    startScroll.current = ref.current.scrollLeft;
    pointerId.current = e.pointerId;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current === null || !ref.current) return;
    const delta = e.clientX - startX.current;
    if (!dragging.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      dragging.current = true;
      ref.current.setPointerCapture(pointerId.current);
    }
    ref.current.scrollLeft = startScroll.current - delta;
  };

  const endDrag = () => {
    dragging.current = false;
    pointerId.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className={`cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {children}
    </div>
  );
}
