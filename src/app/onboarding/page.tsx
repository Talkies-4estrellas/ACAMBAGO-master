"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO =
  !SUPABASE_URL ||
  SUPABASE_URL.includes("your-project") ||
  SUPABASE_URL === "https://placeholder.supabase.co";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace("/login"); return; }

    const setup = async () => {
      if (!IS_DEMO) {
        const supabase = createClient();
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            name: user.fullName ?? user.firstName ?? "Usuario",
            role: "client",
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      }

      router.replace("/perfil");
    };

    setup();
  }, [isLoaded, user?.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#030d1e] to-[#061225]">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
      <p className="text-slate-400 text-sm">Configurando tu cuenta...</p>
    </div>
  );
}
