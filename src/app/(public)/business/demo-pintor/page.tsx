import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_ELECTRONICA, DEMO_COUPONS_PINTOR, DEMO_REVIEWS_PINTOR } from "@/lib/demo-data";

export default function ElectronicaPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-pintor")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_ELECTRONICA}
      coupons={DEMO_COUPONS_PINTOR}
      reviews={DEMO_REVIEWS_PINTOR}
      emoji="📱"
      productLabel="Productos disponibles"
    />
  );
}
