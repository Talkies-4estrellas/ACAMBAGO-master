import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES_EXTRA, DEMO_PRODUCTS_BICICLETAS, DEMO_COUPONS_EXTRA } from "@/lib/demo-data";

export default function BicicletasPage() {
  const business = DEMO_BUSINESSES_EXTRA.find((b) => b.id === "demo-bicicletas")!;
  const coupons = DEMO_COUPONS_EXTRA.filter((c) => c.business_id === "demo-bicicletas");
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_BICICLETAS}
      coupons={coupons}
      reviews={[]}
      emoji="🚴"
      productLabel="Bicicletas y accesorios"
    />
  );
}
