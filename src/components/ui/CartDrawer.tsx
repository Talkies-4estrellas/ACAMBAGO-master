"use client";

import { X, ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, updateQty, total, count } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#060e18]/95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">
              Tu carrito
              {count > 0 && (
                <span className="ml-1.5 text-sm font-normal text-slate-500 dark:text-gray-400">
                  ({count} {count === 1 ? "artículo" : "artículos"})
                </span>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-gray-500">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <ShoppingCart className="w-9 h-9 opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Tu carrito está vacío</p>
              <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">Agrega productos para comenzar</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-2xl">
                  <div className="relative w-14 h-14 rounded-xl bg-slate-200 dark:bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 dark:bg-white/10 dark:border-white/10 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-slate-600 dark:text-gray-300" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-gray-400">Total estimado</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                Proceder al pago
              </button>
              <button onClick={onClose} className="w-full text-sm text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 py-1.5 transition-colors">
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
