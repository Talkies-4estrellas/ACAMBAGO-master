import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_MUEBLES, DEMO_COUPONS_MUEBLES, DEMO_REVIEWS_MUEBLES } from "@/lib/demo-data";

export default function MueblesPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-muebles")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_MUEBLES}
      coupons={DEMO_COUPONS_MUEBLES}
      reviews={DEMO_REVIEWS_MUEBLES}
      emoji="🛋️"
      productLabel="Productos disponibles"
    />
  );
}
