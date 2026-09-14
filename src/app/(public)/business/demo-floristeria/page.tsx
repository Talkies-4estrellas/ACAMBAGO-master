import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES_EXTRA, DEMO_PRODUCTS_FLORISTERIA, DEMO_COUPONS_EXTRA } from "@/lib/demo-data";

export default function FloristPage() {
  const business = DEMO_BUSINESSES_EXTRA.find((b) => b.id === "demo-floristeria")!;
  const coupons = DEMO_COUPONS_EXTRA.filter((c) => c.business_id === "demo-floristeria");
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_FLORISTERIA}
      coupons={coupons}
      reviews={[]}
      emoji="🌸"
      productLabel="Flores y arreglos disponibles"
    />
  );
}
