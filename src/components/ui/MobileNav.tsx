"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Ticket, ShoppingCart, User, Store, Menu } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuthUser } from "@/lib/hooks/use-auth-user";

export default function MobileNav() {
  const pathname = usePathname();
  const { count, openCart, isCartOpen } = useCart();
  const { userId, role } = useAuthUser();

  const perfilHref = userId
    ? role === "admin" ? "/admin" : role === "client" ? "/mas" : "/dashboard/business"
    : "/login";

  const PerfilIcon = !userId ? User : role === "business" ? Store : Menu;

  const tabs = [
    { id: "home",    label: "Inicio",   icon: Home,         href: "/",       isCart: false },
    { id: "search",  label: "Buscar",   icon: Search,       href: "/?q=",    isCart: false },
    { id: "cupones", label: "Cupones",  icon: Ticket,       href: "/coupons",isCart: false },
    { id: "cart",    label: "Carrito",  icon: ShoppingCart, href: null,      isCart: true  },
    { id: "perfil",  label: userId ? (role === "business" ? "Tienda" : "Más") : "Entrar", icon: PerfilIcon, href: perfilHref, isCart: false },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-2">
      <nav className="flex items-center justify-between px-3 py-2.5 rounded-full shadow-2xl border border-slate-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#050f19]/85">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isCart = tab.isCart;
          const active =
            isCart
              ? isCartOpen
              : tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href ?? "__");

          const baseClass =
            "flex items-center gap-1.5 px-3.5 py-2.5 rounded-full transition-all duration-300 ease-out select-none";
          const activeClass =
            "bg-slate-900 text-white shadow-sm font-semibold dark:bg-white dark:text-gray-900";
          const inactiveClass =
            "text-slate-500 hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-300";

          if (isCart) {
            return (
              <button
                key={tab.id}
                onClick={openCart}
                className={`${baseClass} ${active ? activeClass : inactiveClass} relative`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {active && (
                  <span className="text-xs whitespace-nowrap">{tab.label}</span>
                )}
                {count > 0 && !active && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href!}
              className={`${baseClass} ${active ? activeClass : inactiveClass}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {active && (
                <span className="text-xs whitespace-nowrap">{tab.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
