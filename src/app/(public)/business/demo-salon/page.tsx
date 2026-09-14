import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_JOYERIA, DEMO_COUPONS_SALON, DEMO_REVIEWS_SALON } from "@/lib/demo-data";

export default function JoyeriaPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-salon")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_JOYERIA}
      coupons={DEMO_COUPONS_SALON}
      reviews={DEMO_REVIEWS_SALON}
      emoji="💍"
      productLabel="Productos disponibles"
    />
  );
}
