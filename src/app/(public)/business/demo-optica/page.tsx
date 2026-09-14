import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES_EXTRA, DEMO_PRODUCTS_OPTICA, DEMO_COUPONS_EXTRA } from "@/lib/demo-data";

export default function OpticaPage() {
  const business = DEMO_BUSINESSES_EXTRA.find((b) => b.id === "demo-optica")!;
  const coupons = DEMO_COUPONS_EXTRA.filter((c) => c.business_id === "demo-optica");
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_OPTICA}
      coupons={coupons}
      reviews={[]}
      emoji="👓"
      productLabel="Productos disponibles"
    />
  );
}
