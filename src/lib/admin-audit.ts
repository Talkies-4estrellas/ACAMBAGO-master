import { createClient } from "@/lib/supabase/server";

interface AuditEntry {
  adminUserId: string;
  adminName?: string | null;
  action: string;
  targetType: "business" | "user";
  targetId: string;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
}

// Registra una accion sensible del panel admin en admin_audit_log. Nunca debe
// tumbar la accion principal si falla (por ejemplo, si `supabase/admin-audit-log.sql`
// todavia no se corrio en Supabase) — por eso solo se hace console.error, no throw.
export async function logAdminAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entry: AuditEntry
) {
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_user_id: entry.adminUserId,
    admin_name: entry.adminName ?? null,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    target_label: entry.targetLabel ?? null,
    metadata: entry.metadata ?? null,
  });

  if (error) {
    console.error("No se pudo registrar en admin_audit_log (¿ya corriste supabase/admin-audit-log.sql?):", error.message);
  }
}
