import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Borra un producto y sus fotos en Storage. Necesita la service role para
// las fotos: el bucket product-images solo le da permiso de INSERT/SELECT
// a la llave anonima que usa el resto de la app (confirmado en vivo — un
// DELETE con la anon key da 403 "Access denied"), a diferencia de las
// tablas, donde RLS esta deshabilitado y la llave anonima ya puede borrar
// filas sin problema.
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta el id del producto" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("image_url, image_urls, businesses(owner_id)")
      .eq("id", id)
      .single();

    const owner = (product?.businesses as unknown as { owner_id: string } | null)?.owner_id;
    if (!product || owner !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const urls: string[] = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
    const marker = "/product-images/";
    const paths = urls
      .map((url) => { const i = url.indexOf(marker); return i === -1 ? null : url.slice(i + marker.length); })
      .filter((path): path is string => !!path);

    // Best-effort: si borrar las fotos falla, no debe impedir borrar el
    // producto en si — nunca dejar un producto "atorado" por esto.
    if (paths.length > 0) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error: removeErr } = await serviceClient.storage.from("product-images").remove(paths);
      if (removeErr) console.error("No se pudieron borrar las fotos del producto:", removeErr.message);
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// Borra fotos puntuales que quedaron huérfanas al editar un producto (el
// usuario quitó una imagen y/o la reemplazó por otra) — mismo motivo de la
// service role que el DELETE de arriba. El producto en sí no se toca aquí.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const productId = body?.product_id;
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];
    if (!productId || urls.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("businesses(owner_id)")
      .eq("id", productId)
      .single();

    const owner = (product?.businesses as unknown as { owner_id: string } | null)?.owner_id;
    if (!product || owner !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const marker = "/product-images/";
    const paths = urls
      .map((url) => { const i = url.indexOf(marker); return i === -1 ? null : url.slice(i + marker.length); })
      .filter((path): path is string => !!path);

    if (paths.length > 0) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error: removeErr } = await serviceClient.storage.from("product-images").remove(paths);
      if (removeErr) console.error("No se pudieron borrar las fotos reemplazadas:", removeErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
