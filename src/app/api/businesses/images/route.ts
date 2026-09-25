import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Borra el logo/banner viejo de una tienda cuando se reemplaza por uno
// nuevo - mismo motivo y mismo patron que /api/products: el bucket
// business-images tampoco le da permiso de DELETE a la llave anonima que
// usa el resto de la app (confirmado en vivo, 403 "Access denied"), asi
// que hace falta la service role. El negocio en si no se toca aqui.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const businessId = body?.business_id;
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];
    if (!businessId || urls.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .single();

    if (!business || business.owner_id !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const marker = "/business-images/";
    const paths = urls
      .map((url) => { const i = url.indexOf(marker); return i === -1 ? null : url.slice(i + marker.length); })
      .filter((path): path is string => !!path);

    if (paths.length > 0) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error: removeErr } = await serviceClient.storage.from("business-images").remove(paths);
      if (removeErr) console.error("No se pudieron borrar las fotos reemplazadas del negocio:", removeErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
