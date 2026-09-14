"use client";

import { useRef } from "react";

// Permite arrastrar con el mouse (click y arrastra) en listas horizontales;
// el swipe con el dedo en móvil ya funciona nativo gracias a overflow-x-auto.
export default function DragScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    dragging.current = true;
    startX.current = e.clientX;
    startScroll.current = ref.current.scrollLeft;
    ref.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !ref.current) return;
    ref.current.scrollLeft = startScroll.current - (e.clientX - startX.current);
  };

  const endDrag = () => { dragging.current = false; };

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
