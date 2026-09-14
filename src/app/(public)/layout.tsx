import Navbar from "@/components/ui/Navbar";
import DesktopShell from "@/components/ui/DesktopShell";
import Footer from "@/components/ui/Footer";
import MobileNav from "@/components/ui/MobileNav";
import CartRoot from "@/components/ui/CartRoot";
import DemoBanner from "@/components/ui/DemoBanner";
import { CartProvider } from "@/lib/cart-context";
import { UserLocationProvider } from "@/lib/user-location-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserLocationProvider>
      <CartProvider>
        <div className="min-h-screen">
          <DemoBanner />

          {/* Sidebar izquierdo solo en desktop (fixed, fuera de flujo), con
              flecha para ocultarlo/mostrarlo; ajusta el margen del contenido. */}
          <DesktopShell>
            {/* Navbar solo en mobile */}
            <Navbar />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <Footer />
          </DesktopShell>

          {/* Nav inferior solo en mobile */}
          <MobileNav />
          <CartRoot />
        </div>
      </CartProvider>
    </UserLocationProvider>
  );
}
