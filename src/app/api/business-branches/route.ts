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
    const { business_id, name, address, latitude, longitude, whatsapp } = body;

    if (!business_id || !name || !address) {
      return NextResponse.json({ error: "Negocio, nombre y dirección son requeridos" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", business_id)
      .single();

    if (!business || business.owner_id !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("business_branches")
      .insert({
        business_id,
        name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        whatsapp: whatsapp || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ branch: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta el id de la sucursal" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: branch } = await supabase
      .from("business_branches")
      .select("business_id, businesses(owner_id)")
      .eq("id", id)
      .single();

    const owner = (branch?.businesses as unknown as { owner_id: string } | null)?.owner_id;
    if (!branch || owner !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { error } = await supabase.from("business_branches").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
