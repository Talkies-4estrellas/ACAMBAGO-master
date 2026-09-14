import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS, DEMO_COUPONS, DEMO_REVIEWS } from "@/lib/demo-data";

export default function FerreteriaDemoPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS}
      coupons={DEMO_COUPONS}
      reviews={DEMO_REVIEWS}
      emoji="🔧"
      productLabel="Productos"
    />
  );
}
