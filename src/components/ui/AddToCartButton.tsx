"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

interface Props {
  product: {
    id: string;
    business_id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function AddToCartButton({ product, size = "md", disabled = false }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (size === "sm") {
    return (
      <button
        onClick={handleAdd}
        disabled={disabled}
        className={`p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          added
            ? "bg-green-500 text-white"
            : "bg-brand-600 hover:bg-brand-700 text-white"
        }`}
        title={disabled ? "Agotado" : "Agregar al carrito"}
      >
        {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        added
          ? "bg-green-500 text-white"
          : disabled
          ? "bg-slate-400 dark:bg-white/10 text-white"
          : "bg-brand-600 hover:bg-brand-700 text-white"
      }`}
    >
      {added ? (
        <>
          <Check className="w-4 h-4 flex-shrink-0" />
          Agregado
        </>
      ) : disabled ? (
        "Agotado"
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="sm:hidden">Agregar</span>
          <span className="hidden sm:inline">Agregar al carrito</span>
        </>
      )}
    </button>
  );
}
