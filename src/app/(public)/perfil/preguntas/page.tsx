"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProductQuestion } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

type QuestionRow = ProductQuestion & { products: { id: string; name: string } | null };

export default function MisPreguntasPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEMO) { setLoading(false); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }

    const supabase = createClient();
    supabase
      .from("product_questions")
      .select("*, products(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as unknown as QuestionRow[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-500" /> Mis preguntas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Preguntas que has hecho a los vendedores</p>
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">
          Conecta Supabase para ver tus preguntas reales.
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Todavía no le has preguntado nada a ningún vendedor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="card p-4">
              {q.products && (
                <Link href={`/product/${q.products.id}`} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  {q.products.name}
                </Link>
              )}
              <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{q.question}</p>
              {q.answer ? (
                <div className="mt-2 pl-3 border-l-2 border-brand-300 dark:border-brand-500/50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Respuesta del vendedor
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{q.answer}</p>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3" /> Esperando respuesta
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{format(new Date(q.created_at), "dd MMM yyyy", { locale: es })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
