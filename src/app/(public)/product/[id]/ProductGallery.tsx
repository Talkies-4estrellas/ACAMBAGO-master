"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex gap-3">
      {/* Miniaturas verticales (escritorio), estilo Mercado Libre: fijas, sin auto-avance */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === selected
                  ? "border-brand-500 opacity-100 shadow-sm"
                  : "border-slate-200 dark:border-white/10 opacity-55 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${name} - ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3 min-w-0">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <Image
            key={selected}
            src={images[selected]}
            alt={`${name} - imagen ${selected + 1}`}
            fill
            className="object-cover"
            priority={selected === 0}
          />
        </div>

        {/* Miniaturas horizontales (celular) */}
        {images.length > 1 && (
          <div className="flex gap-2 sm:hidden">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  i === selected
                    ? "border-brand-500 opacity-100 shadow-sm"
                    : "border-slate-200 dark:border-white/10 opacity-55 hover:opacity-100"
                }`}
              >
                <Image src={img} alt={`${name} - ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
