"use client";

import { useCart } from "@/lib/cart-context";
import CartDrawer from "./CartDrawer";

export default function CartRoot() {
  const { isCartOpen, closeCart } = useCart();
  return <CartDrawer isOpen={isCartOpen} onClose={closeCart} />;
}
