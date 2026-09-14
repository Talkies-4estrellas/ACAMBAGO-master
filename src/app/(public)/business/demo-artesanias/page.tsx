import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_ARTESANIAS, DEMO_COUPONS_ARTESANIAS, DEMO_REVIEWS_ARTESANIAS } from "@/lib/demo-data";

export default function ArtesaniasPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-artesanias")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_ARTESANIAS}
      coupons={DEMO_COUPONS_ARTESANIAS}
      reviews={DEMO_REVIEWS_ARTESANIAS}
      emoji="🏺"
      productLabel="Productos disponibles"
    />
  );
}
