import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_FARMACIA, DEMO_COUPONS_FARMACIA, DEMO_REVIEWS_FARMACIA } from "@/lib/demo-data";

export default function FarmaciaPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-farmacia")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_FARMACIA}
      coupons={DEMO_COUPONS_FARMACIA}
      reviews={DEMO_REVIEWS_FARMACIA}
      emoji="💊"
      productLabel="Productos disponibles"
    />
  );
}
