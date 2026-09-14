import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

    const { banner_url } = body;

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name,
        description,
        category,
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

    // Sube el rol a "business" solo si no es ya algo con mas privilegio
    // (admin) — antes esto se hacia sin condicion y una cuenta admin que
    // creara una tienda perdia su rol de admin sin ningun aviso.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "admin") {
      await supabase.from("profiles").update({ role: "business" }).eq("id", userId);
    }

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
          body: `${category} · ${address}`,
          link: "/admin?tab=negocios",
        }))
      );
    }

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
