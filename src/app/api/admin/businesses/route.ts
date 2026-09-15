import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";

const ACTIONS = ["approve", "suspend", "reactivate", "delete"] as const;
type Action = (typeof ACTIONS)[number];

// Aprueba, suspende, reactiva o elimina un negocio. Antes estas acciones se
// hacían con supabase.from("businesses").update()/.delete() directo desde el
// cliente — solo el botón estaba oculto a quien no fuera admin, pero como RLS
// está deshabilitado en la base, cualquiera con la anon key podía llamar la
// misma mutación sin pasar por ningún admin real. Ahora, igual que
// /api/admin/coupon-credits, la autorización se valida aquí en el servidor.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const businessId = body.business_id;
    const action = body.action as Action;

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json({ error: "Falta el id del negocio" }, { status: 400 });
    }
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, owner_id, name")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    if (action === "approve") {
      const { error } = await supabase.from("businesses").update({ is_approved: true, is_active: true }).eq("id", businessId);
      if (error) return NextResponse.json({ error: "No se pudo aprobar" }, { status: 500 });

      // El rol sube a "business" justo aqui, al aprobar — no antes (ver
      // /api/businesses). No baja a un admin que aprueba su propia tienda.
      const { data: ownerProfile } = await supabase.from("profiles").select("role").eq("id", business.owner_id).single();
      if (ownerProfile?.role !== "admin") {
        await supabase.from("profiles").update({ role: "business" }).eq("id", business.owner_id);
      }
    } else if (action === "suspend") {
      const { error } = await supabase.from("businesses").update({ is_active: false }).eq("id", businessId);
      if (error) return NextResponse.json({ error: "No se pudo suspender" }, { status: 500 });
    } else if (action === "reactivate") {
      const { error } = await supabase.from("businesses").update({ is_active: true }).eq("id", businessId);
      if (error) return NextResponse.json({ error: "No se pudo reactivar" }, { status: 500 });
    } else if (action === "delete") {
      // Cascada: elimina también productos, pedidos, reseñas, cupones y
      // mensajes de este negocio (ON DELETE CASCADE en el schema).
      const { error } = await supabase.from("businesses").delete().eq("id", businessId);
      if (error) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });

      // Solo degrada a "client" si el dueño era "business" — un admin que
      // crea y luego borra su propia tienda de prueba debe seguir siendo
      // admin (bug real: esto le quitó el rol de admin a un admin real).
      const { data: ownerProfile } = await supabase.from("profiles").select("role").eq("id", business.owner_id).single();
      if (ownerProfile?.role === "business") {
        const { count } = await supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", business.owner_id);
        if (!count) {
          await supabase.from("profiles").update({ role: "client" }).eq("id", business.owner_id);
        }
      }
    }

    await logAdminAction(supabase, {
      adminUserId: userId,
      adminName: profile?.name,
      action: `business_${action}`,
      targetType: "business",
      targetId: businessId,
      targetLabel: business.name,
    });

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error("Error en /api/admin/businesses:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
