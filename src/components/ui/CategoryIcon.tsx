import { Store } from "lucide-react";
import { CATEGORY_ICONS } from "@/types";

interface Props {
  category: string;
  className?: string;
}

// Ícono plano (lucide-react) para una categoría de negocio, con "Otro"
// (tienda genérica) como respaldo si la categoría no está en el mapa.
export default function CategoryIcon({ category, className }: Props) {
  const Icon = CATEGORY_ICONS[category] ?? Store;
  return <Icon className={className} />;
}
