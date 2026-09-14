"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Package, ArrowRight, Ticket, Store, Star } from "lucide-react";
import SearchBar from "./SearchBar";

interface Slide {
  eyebrow: string;
  eyebrowIcon: typeof MapPin;
  title: string;
  highlight: string;
  desc: string;
  gradient: string;
  primaryCta: { label: string; href: string; icon?: typeof Package };
  secondaryCta?: { label: string; href: string };
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Acámbaro, Guanajuato",
    eyebrowIcon: MapPin,
    title: "Compra local,",
    highlight: "apoya tu ciudad",
    desc: "El marketplace de productos locales de Acámbaro. Encuentra lo que necesitas en tiendas de tu comunidad.",
    gradient: "from-brand-900/95 via-[#060e18]/90 to-brand-800/85",
    primaryCta: { label: "Ver productos", href: "/productos", icon: Package },
    secondaryCta: { label: "Publicar mi tienda", href: "/perfil/crear-tienda" },
  },
  {
    eyebrow: "Para vendedores locales",
    eyebrowIcon: Store,
    title: "Publica tu tienda",
    highlight: "gratis, hoy mismo",
    desc: "Sube tus productos, recibe pedidos por la app y ofrece cupones con QR. Sin costo de entrada.",
    gradient: "from-emerald-900/95 via-[#06140f]/90 to-brand-900/85",
    primaryCta: { label: "Crear mi tienda", href: "/perfil/crear-tienda", icon: Store },
  },
  {
    eyebrow: "Ahorra en tus compras",
    eyebrowIcon: Ticket,
    title: "Cupones exclusivos",
    highlight: "con código QR",
    desc: "Descuentos reales de negocios de Acámbaro, listos para canjear mostrando tu celular en tienda.",
    gradient: "from-orange-950/95 via-[#1a0e06]/90 to-brand-900/85",
    primaryCta: { label: "Ver cupones", href: "/coupons", icon: Ticket },
  },
  {
    eyebrow: "Negocios cerca de ti",
    eyebrowIcon: MapPin,
    title: "Encuéntralos",
    highlight: "en el mapa",
    desc: "Ubica tiendas locales directo en un mapa interactivo de Acámbaro.",
    gradient: "from-sky-950/95 via-[#050e18]/90 to-brand-900/85",
    primaryCta: { label: "Ver mapa", href: "/map", icon: MapPin },
  },
];

const SLIDE_DURATION = 5500;

export default function HeroCarousel({ defaultSearch, totalCount }: { defaultSearch?: string; totalCount: number }) {
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!pausedRef.current) setCurrent((c) => (c + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => setCurrent((i + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[current];
  const PrimaryIcon = slide.primaryCta.icon;

  return (
    <section
      className="relative text-white overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {SLIDES.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}>
          <Image src="/hero-iglesia.jpg" alt="Acámbaro" fill className="object-cover object-center" priority={i === 0} />
          <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
        </div>
      ))}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-48 h-48 bg-brand-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-brand-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Flechas */}
      <button
        onClick={() => goTo(current - 1)}
        aria-label="Anterior"
        className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => goTo(current + 1)}
        aria-label="Siguiente"
        className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-center relative z-10">
        <div key={current}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <slide.eyebrowIcon className="w-4 h-4 text-brand-300" />
            {slide.eyebrow}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {slide.title}<br />
            <span className="text-brand-300">{slide.highlight}</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">{slide.desc}</p>
        </div>

        <SearchBar defaultValue={defaultSearch} />

        <div key={`cta-${current}`} className="flex items-center justify-center gap-3 flex-wrap">
          <Link href={slide.primaryCta.href} className="bg-white text-brand-800 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm flex items-center gap-2 shadow-lg">
            {PrimaryIcon && <PrimaryIcon className="w-4 h-4" />} {slide.primaryCta.label}
          </Link>
          {slide.secondaryCta && (
            <Link href={slide.secondaryCta.href} className="bg-brand-500/20 hover:bg-brand-500/30 border border-brand-400/50 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm flex items-center gap-2">
              {slide.secondaryCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-10 text-sm text-gray-400">
          <Star className="w-4 h-4 text-brand-400 fill-brand-400" />{totalCount} tiendas activas en Acámbaro
        </div>

        {/* Puntos */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === current ? "bg-white w-6" : "bg-white/40 w-2 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
