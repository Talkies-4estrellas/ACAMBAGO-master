"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import { ProductQuestion } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  productId: string;
  productName: string;
  businessId: string;
  businessOwnerId?: string;
  initialQuestions: ProductQuestion[];
}

export default function ProductQA({ productId, productName, businessId, businessOwnerId, initialQuestions }: Props) {
  const { user } = useUser();
  const [questions, setQuestions] = useState(initialQuestions);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para preguntar");
      return;
    }
    if (!question.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("product_questions")
      .insert({ product_id: productId, business_id: businessId, user_id: user.id, question: question.trim() })
      .select()
      .single();

    if (error) {
      toast.error("No se pudo enviar tu pregunta");
    } else {
      setQuestions([data as ProductQuestion, ...questions]);
      setQuestion("");
      toast.success("Pregunta enviada");
      if (businessOwnerId) {
        await createNotification(supabase, {
          user_id: businessOwnerId,
          type: "new_question",
          title: "Nueva pregunta de un cliente",
          body: `Sobre "${productName}": ${question.trim().slice(0, 80)}`,
          link: "/dashboard/business/preguntas",
        });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand-600" />
        Preguntas y respuestas ({questions.length})
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe tu pregunta sobre este producto..."
          className="input flex-1"
        />
        <button type="submit" disabled={submitting || !question.trim()} className="btn-primary text-sm px-4 flex-shrink-0">
          {submitting ? "..." : "Preguntar"}
        </button>
      </form>

      {questions.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Todavía no hay preguntas para este producto. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="border-t border-slate-100 dark:border-white/10 pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm text-slate-800 dark:text-slate-200">{q.question}</p>
              {q.answer ? (
                <div className="mt-1.5 pl-3 border-l-2 border-brand-300 dark:border-brand-500/50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Respuesta del vendedor
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{q.answer}</p>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> Esperando respuesta
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{format(new Date(q.created_at), "dd MMM yyyy", { locale: es })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
