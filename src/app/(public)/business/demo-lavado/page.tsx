import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_ROPA, DEMO_COUPONS_LAVADO, DEMO_REVIEWS_LAVADO } from "@/lib/demo-data";

export default function RopaPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-lavado")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_ROPA}
      coupons={DEMO_COUPONS_LAVADO}
      reviews={DEMO_REVIEWS_LAVADO}
      emoji="👗"
      productLabel="Productos disponibles"
    />
  );
}
