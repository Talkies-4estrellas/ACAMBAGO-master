import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";

const ROLES = ["client", "business", "admin"] as const;
type Role = (typeof ROLES)[number];

// Cambia el rol de un usuario desde el panel admin. Antes esto solo se podia
// hacer directo en la base de datos (no habia UI). Igual que en
// /api/admin/businesses, la autorizacion se valida aqui en el servidor.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", userId)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = body.user_id;
    const newRole = body.role as Role;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Falta el id del usuario" }, { status: 400 });
    }
    if (!ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    if (targetUserId === userId) {
      return NextResponse.json({ error: "No puedes cambiar tu propio rol. Pide a otro administrador que lo haga." }, { status: 400 });
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("id", targetUserId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (targetProfile.role === newRole) {
      return NextResponse.json({ success: true, unchanged: true });
    }

    if (targetProfile.role === "business" && newRole !== "business") {
      const { count } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", targetUserId);
      if (count && count > 0) {
        return NextResponse.json(
          { error: `Este usuario todavía tiene ${count} tienda(s). Elimínalas o reasígnalas antes de quitarle el rol de negocio.` },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", targetUserId);
    if (error) {
      return NextResponse.json({ error: "No se pudo cambiar el rol" }, { status: 500 });
    }

    await logAdminAction(supabase, {
      adminUserId: userId,
      adminName: adminProfile?.name,
      action: "user_role_change",
      targetType: "user",
      targetId: targetUserId,
      targetLabel: targetProfile.name,
      metadata: { from_role: targetProfile.role, to_role: newRole },
    });

    return NextResponse.json({ success: true, from_role: targetProfile.role, to_role: newRole });
  } catch (err) {
    console.error("Error en /api/admin/users:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
