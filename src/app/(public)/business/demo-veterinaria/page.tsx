import DemoBusinessPage from "@/components/business/DemoBusinessPage";
import { DEMO_BUSINESSES, DEMO_PRODUCTS_PETSHOP, DEMO_COUPONS_VETERINARIA, DEMO_REVIEWS_VETERINARIA } from "@/lib/demo-data";

export default function PetShopPage() {
  const business = DEMO_BUSINESSES.find((b) => b.id === "demo-veterinaria")!;
  return (
    <DemoBusinessPage
      business={business}
      products={DEMO_PRODUCTS_PETSHOP}
      coupons={DEMO_COUPONS_VETERINARIA}
      reviews={DEMO_REVIEWS_VETERINARIA}
      emoji="🐾"
      productLabel="Productos disponibles"
    />
  );
}
