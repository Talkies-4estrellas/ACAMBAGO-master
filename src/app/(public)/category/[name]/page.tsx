import { createClient } from "@/lib/supabase/server";
import BusinessCard from "@/components/business/BusinessCard";
import { Business } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("is_approved", true)
    .eq("is_active", true)
    .eq("category", decodedName)
    .order("rating_avg", { ascending: false });

  const businesses = (data ?? []) as Business[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Inicio
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{decodedName}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{businesses.length} negocios encontrados</p>

      {businesses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">😔</p>
          <p className="text-gray-500 dark:text-gray-400">No hay negocios en esta categoría todavía</p>
          <Link href="/" className="btn-primary mt-4 inline-block">Explorar otros</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  );
}
