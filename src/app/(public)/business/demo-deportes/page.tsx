import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_DEPORTES, DEMO_COUPONS_DEPORTES, DEMO_REVIEWS_DEPORTES } from "@/lib/demo-data";

export default function DeportesPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-deportes")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_DEPORTES}
      coupons={DEMO_COUPONS_DEPORTES}
      reviews={DEMO_REVIEWS_DEPORTES}
      emoji="⚽"
      productLabel="Productos disponibles"
    />
  );
}
