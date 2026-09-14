import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES_EXTRA, DEMO_PRODUCTS_RELOJERIA, DEMO_COUPONS_EXTRA } from "@/lib/demo-data";

export default function RelojPage() {
  const business = DEMO_BUSINESSES_EXTRA.find((b) => b.id === "demo-relojeria")!;
  const coupons = DEMO_COUPONS_EXTRA.filter((c) => c.business_id === "demo-relojeria");
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_RELOJERIA}
      coupons={coupons}
      reviews={[]}
      emoji="⌚"
      productLabel="Relojes y accesorios"
    />
  );
}
