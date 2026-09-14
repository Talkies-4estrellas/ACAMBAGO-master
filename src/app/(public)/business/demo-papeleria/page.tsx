import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_PAPELERIA, DEMO_COUPONS_PAPELERIA, DEMO_REVIEWS_PAPELERIA } from "@/lib/demo-data";

export default function PapeleriaPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-papeleria")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_PAPELERIA}
      coupons={DEMO_COUPONS_PAPELERIA}
      reviews={DEMO_REVIEWS_PAPELERIA}
      emoji="📚"
      productLabel="Productos disponibles"
    />
  );
}
