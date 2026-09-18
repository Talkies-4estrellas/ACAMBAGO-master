import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import PerfilShell from "./PerfilShell";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
  // El admin ya no tiene lado de comprador: su único panel es /admin,
  // incluida su propia información de perfil (ver AdminProfileSection en
  // ese panel) — nunca /perfil, ni /dashboard/business.
  if (!IS_DEMO) {
    const { userId } = await auth();
    if (userId) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
      if (profile?.role === "admin") redirect("/admin");
    }
  }

  return <PerfilShell>{children}</PerfilShell>;
}
