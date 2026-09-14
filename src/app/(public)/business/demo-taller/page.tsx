import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_COSMETICOS, DEMO_COUPONS_TALLER, DEMO_REVIEWS_TALLER } from "@/lib/demo-data";

export default function CosmeticosPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-taller")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_COSMETICOS}
      coupons={DEMO_COUPONS_TALLER}
      reviews={DEMO_REVIEWS_TALLER}
      emoji="💄"
      productLabel="Productos disponibles"
    />
  );
}
