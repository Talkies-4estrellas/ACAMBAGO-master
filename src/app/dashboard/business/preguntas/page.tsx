"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { loadOwnedBusinesses } from "@/lib/current-business";
import { createNotification } from "@/lib/notifications";
import { ProductQuestion } from "@/types";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

type QuestionRow = ProductQuestion & { products: { id: string; name: string } | null };

export default function PreguntasPage() {
  const { user, isLoaded } = useUser();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      if (IS_DEMO) { setLoaded(true); return; }
      if (!isLoaded || !user) return;
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) return;
      const { data } = await supabase
        .from("product_questions")
        .select("*, products(id, name)")
        .eq("business_id", biz.id)
        .order("answer", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: false });
      setQuestions((data ?? []) as unknown as QuestionRow[]);
      setLoaded(true);
    };
    load();
  }, [isLoaded, user?.id]);

  const handleAnswer = async (q: QuestionRow) => {
    const answer = drafts[q.id]?.trim();
    if (!answer) return;
    setSending(q.id);

    const { error } = await supabase
      .from("product_questions")
      .update({ answer, answered_at: new Date().toISOString() })
      .eq("id", q.id);

    if (error) {
      toast.error("No se pudo enviar la respuesta");
    } else {
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...item, answer, answered_at: new Date().toISOString() } : item)));
      toast.success("Respuesta enviada");
      await createNotification(supabase, {
        user_id: q.user_id,
        type: "question_answered",
        title: "Un vendedor respondió tu pregunta",
        body: q.products ? `Sobre "${q.products.name}": ${answer.slice(0, 80)}` : answer.slice(0, 80),
        link: `/product/${q.product_id}`,
      });
    }
    setSending(null);
  };

  const pending = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-600" /> Preguntas de clientes
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{pending.length} sin responder</p>
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-gray-400 dark:text-slate-500">Conecta Supabase para ver preguntas reales.</div>
      ) : !loaded ? (
        <div className="card p-10 text-center text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : questions.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">Todavía no tienes preguntas de clientes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...pending, ...answered].map((q) => (
            <div key={q.id} className="card p-4">
              {q.products && (
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">{q.products.name}</p>
              )}
              <p className="text-sm text-gray-900 dark:text-white mt-1">{q.question}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{format(new Date(q.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>

              {q.answer ? (
                <div className="mt-3 pl-3 border-l-2 border-green-400">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tu respuesta
                  </p>
                  <p className="text-sm text-gray-700 dark:text-slate-300 mt-0.5">{q.answer}</p>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <input
                    value={drafts[q.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })}
                    placeholder="Escribe tu respuesta..."
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => handleAnswer(q)}
                    disabled={sending === q.id || !drafts[q.id]?.trim()}
                    className="btn-primary text-sm px-3 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Responder
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
