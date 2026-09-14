import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Cuántos cupones asigna el botón "Asignar 10 cupones" del panel de admin.
// El resto de este archivo ya acepta cualquier cantidad positiva vía
// `amount` en el body, así que agregar en el futuro un botón de "cantidad
// personalizada" solo requiere mandar un valor distinto, sin tocar el backend.
const DEFAULT_GRANT_AMOUNT = 10;

// Asigna cupones disponibles a un negocio (se suman al saldo actual, no lo
// reemplazan). Solo el Super Administrador puede llamar esta ruta.
export async function POST(request: Request) {
  try {
    // 1. Autenticación: debe haber una sesión de Clerk válida.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    // 2. Autorización: solo perfiles con role = "admin" pueden asignar
    // cupones. Esta verificación se hace en el servidor (no basta con
    // ocultar el botón en el cliente), porque cualquiera podría llamar
    // esta ruta directo con curl/fetch si no se valida aquí.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Solo un administrador puede asignar cupones" }, { status: 403 });
    }

    // 3. Validar el body de la petición.
    const body = await request.json().catch(() => ({}));
    const businessId = body.business_id;
    const amount = body.amount ?? DEFAULT_GRANT_AMOUNT;

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json({ error: "Falta el id del negocio" }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "La cantidad de cupones debe ser un entero mayor a cero" }, { status: 400 });
    }

    // 4. Verificar que el negocio exista antes de llamar al RPC, para poder
    // devolver su nombre en la respuesta (útil para el mensaje de éxito).
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // 5. Asignar los cupones: suma el saldo y registra el historial (quién,
    // cuánto, cuándo) en una sola transacción atómica dentro del RPC, para
    // que no pueda quedar el saldo actualizado sin su registro de historial
    // (o viceversa) si algo falla a la mitad.
    const { data: newTotal, error: rpcError } = await supabase.rpc("grant_coupon_credits", {
      p_business_id: businessId,
      p_admin_user_id: userId,
      p_amount: amount,
    });

    if (rpcError) {
      console.error("Error asignando cupones:", rpcError);
      return NextResponse.json({ error: "No se pudieron asignar los cupones" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      business_id: businessId,
      business_name: business.name,
      amount,
      new_total: newTotal as number,
    });
  } catch (err) {
    console.error("Error en /api/admin/coupon-credits:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
