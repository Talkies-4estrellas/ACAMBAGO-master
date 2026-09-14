import { redirect } from "next/navigation";

// Consolidado dentro de /productos como el filtro de orden "Más vendidos",
// para no mantener una página casi idéntica por separado. Este archivo se
// conserva solo como redirect, por si algún link externo o marcador viejo
// sigue apuntando aquí.
export default function MasVendidosRedirect() {
  redirect("/productos?sort=vendidos");
}
