import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES_EXTRA, DEMO_PRODUCTS_JUGUETERIA, DEMO_COUPONS_EXTRA } from "@/lib/demo-data";

export default function JugueteriaPage() {
  const business = DEMO_BUSINESSES_EXTRA.find((b) => b.id === "demo-jugueteria")!;
  const coupons = DEMO_COUPONS_EXTRA.filter((c) => c.business_id === "demo-jugueteria");
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_JUGUETERIA}
      coupons={coupons}
      reviews={[]}
      emoji="🧸"
      productLabel="Juguetes disponibles"
    />
  );
}
