import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { findOrCreateCategory } from "@/lib/categories";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { name, description, category, address, latitude, longitude, whatsapp, image_url } = body;

    if (!name || !category || !address) {
      return NextResponse.json({ error: "Nombre, categoría y dirección son requeridos" }, { status: 400 });
    }

    // Normaliza contra la tabla real de categorías (raíz) en vez de guardar
    // lo que mande el cliente tal cual — mismo criterio que usa el selector
    // al crear una categoría nueva al vuelo, así nunca queda un nombre
    // distinto por mayúsculas/espacios entre dos negocios.
    const resolvedCategory = await findOrCreateCategory(supabase, category, null);
    if (!resolvedCategory) {
      return NextResponse.json({ error: "No se pudo resolver la categoría" }, { status: 500 });
    }

    const { banner_url } = body;

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name,
        description,
        category: resolvedCategory.name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        whatsapp,
        image_url: image_url || null,
        banner_url: banner_url || null,
        is_approved: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // El rol se queda en "client" (o "admin") hasta que un admin apruebe
    // esta tienda — ver /api/admin/businesses, acción "approve". Antes se
    // subia a "business" aqui mismo, al crearla, lo que hacia que el dueño
    // se viera y actuara como vendedor (badge, notificaciones, switcher de
    // tienda) antes de que nadie revisara nada.

    // Avisa a todos los admins que hay una tienda nueva esperando aprobacion
    // (aparece en la campana de /admin). Best-effort: si falla, no debe
    // tumbar la creacion de la tienda.
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          type: "new_business_pending",
          title: `Nueva tienda pendiente: ${name}`,
          body: `${resolvedCategory.name} · ${address}`,
          link: "/admin?tab=negocios",
        }))
      );
    }

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
