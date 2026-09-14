import { redirect } from "next/navigation";

// Consolidado dentro de /productos como el filtro de orden "Menor precio",
// para no mantener una página casi idéntica por separado. Este archivo se
// conserva solo como redirect, por si algún link externo o marcador viejo
// sigue apuntando aquí.
export default function MenosDe500Redirect() {
  redirect("/productos?sort=precio_asc");
}
