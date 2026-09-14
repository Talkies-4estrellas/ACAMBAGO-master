"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

export default function MiniCarousel({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);

  // Movimiento automático, igual que el carrusel de "Productos Destacados".
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setSelected((s) => (s + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Package className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((s) => (s - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((s) => (s + 1) % images.length);
  };

  return (
    <div className="relative w-full h-full">
      <Image src={images[selected]} alt={name} fill className="object-cover" />
      {images.length > 1 && (
        <>
          <span className="absolute top-2 right-2 text-xs font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full leading-tight">
            {selected + 1}/{images.length}
          </span>
          <button
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={next}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === selected ? "bg-white w-3" : "bg-white/60 w-1.5"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
