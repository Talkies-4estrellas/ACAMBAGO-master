"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

// Qué tanto se magnifica el panel de zoom respecto al tamaño real de la
// imagen principal — 2 = el panel muestra el doble de detalle. El lente
// (el cuadro que se ve sobre la foto mientras se mueve el mouse) siempre
// mide 1/ZOOM_FACTOR de la imagen, para que quepa justo lo que se ve
// amplificado en el panel.
const ZOOM_FACTOR = 2.2;
const LENS_SIZE = 1 / ZOOM_FACTOR;

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0.5, y: 0.5 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageBoxRef = useRef<HTMLDivElement>(null);

  const openLightbox = (i: number) => {
    setSelected(i);
    setLightboxOpen(true);
  };

  const goTo = (i: number) => setSelected((i + images.length) % images.length);

  // Escape/flechas mientras el visor grande está abierto — solo se
  // registra el listener mientras realmente está abierto.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goTo(selected - 1);
      if (e.key === "ArrowRight") goTo(selected + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, selected, images.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imageBoxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setZoomPos({ x, y });
  };

  const lensPos = {
    left: `${Math.min(Math.max(zoomPos.x - LENS_SIZE / 2, 0), 1 - LENS_SIZE) * 100}%`,
    top: `${Math.min(Math.max(zoomPos.y - LENS_SIZE / 2, 0), 1 - LENS_SIZE) * 100}%`,
  };

  return (
    <div className="flex gap-3">
      {/* Miniaturas verticales (escritorio), estilo Mercado Libre: fijas, sin auto-avance */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              onMouseEnter={() => setSelected(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-white/5 transition-all ${
                i === selected
                  ? "border-brand-500 opacity-100 shadow-sm"
                  : "border-slate-200 dark:border-white/10 opacity-55 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${name} - ${i + 1}`} width={64} height={64} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3 min-w-0">
        {/* "relative" propio: el panel de zoom se posiciona con left-full
            respecto a este contenedor, no respecto a la imagen misma, para
            no quedar dentro del overflow-hidden que recorta la foto. */}
        <div className="relative">
        <div
          ref={imageBoxRef}
          className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-zoom-in"
          onMouseEnter={() => setZoomActive(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomActive(false)}
          onClick={() => openLightbox(selected)}
        >
          <Image
            key={selected}
            src={images[selected]}
            alt={`${name} - imagen ${selected + 1}`}
            fill
            className="object-contain"
            priority={selected === 0}
          />
          {zoomActive && (
            <div
              className="hidden lg:block absolute border-2 border-brand-400 bg-white/30 pointer-events-none"
              style={{ width: `${LENS_SIZE * 100}%`, height: `${LENS_SIZE * 100}%`, ...lensPos }}
            />
          )}
          <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center pointer-events-none">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Panel de zoom estilo Mercado Libre: aparece a la derecha de la
            imagen principal solo en escritorio (no hay espacio en celular,
            que además no tiene "hover" real). */}
        {zoomActive && (
          <div
            className="hidden lg:block absolute top-0 left-full ml-3 w-80 h-80 rounded-2xl border border-slate-200 dark:border-white/10 bg-white z-20 shadow-lg pointer-events-none"
            style={{
              backgroundImage: `url(${images[selected]})`,
              backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${zoomPos.x * 100}% ${zoomPos.y * 100}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        </div>

        {/* Miniaturas horizontales (celular) */}
        {images.length > 1 && (
          <div className="flex gap-2 sm:hidden">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-white/5 transition-all ${
                  i === selected
                    ? "border-brand-500 opacity-100 shadow-sm"
                    : "border-slate-200 dark:border-white/10 opacity-55 hover:opacity-100"
                }`}
              >
                <Image src={img} alt={`${name} - ${i + 1}`} width={64} height={64} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visor en grande, a pantalla completa */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <span className="absolute top-4 left-4 text-white/80 text-sm font-medium">
            {selected + 1} / {images.length}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(selected - 1); }}
                aria-label="Foto anterior"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(selected + 1); }}
                aria-label="Foto siguiente"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-4xl max-h-[80vh] mx-12 sm:mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={`${name} - imagen ${selected + 1}`}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
