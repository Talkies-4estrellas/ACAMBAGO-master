"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Store, Tag, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/hooks/use-categories";
import { DEMO_BUSINESSES, DEMO_BUSINESSES_EXTRA, DEMO_ALL_PRODUCTS } from "@/lib/demo-data";

const ALL_DEMO_BUSINESSES = [...DEMO_BUSINESSES, ...DEMO_BUSINESSES_EXTRA];
const demoBusinessById = new Map(ALL_DEMO_BUSINESSES.map((b) => [b.id, b]));

interface Suggestion {
  type: "business" | "category" | "product";
  key: string;
  label: string;
  sublabel: string;
  href: string;
}

export default function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const { flat: categoriesFlat } = useCategories();
  const [value, setValue] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const term = value.trim().toLowerCase();
    let cancelled = false;

    const timeout = setTimeout(async () => {
      if (!term) {
        if (!cancelled) { setSuggestions([]); setOpen(false); }
        return;
      }

      const categoryMatches: Suggestion[] = categoriesFlat
        .map((c) => c.name)
        .filter((c) => c.toLowerCase().includes(term))
        .slice(0, 3)
        .map((c) => ({ type: "category", key: `cat-${c}`, label: c, sublabel: "Categoría", href: `/?category=${encodeURIComponent(c)}` }));

      const demoMatches: Suggestion[] = ALL_DEMO_BUSINESSES
        .filter((b) => b.name.toLowerCase().includes(term) || b.category.toLowerCase().includes(term))
        .slice(0, 5)
        .map((b) => ({ type: "business", key: `biz-${b.id}`, label: b.name, sublabel: b.category, href: `/business/${b.id}` }));

      // Productos demo: para que "taladro" sugiera el producto y diga en
      // que tienda esta, no solo negocios cuyo nombre coincida.
      const demoProductMatches: Suggestion[] = DEMO_ALL_PRODUCTS
        .filter((p) => p.name.toLowerCase().includes(term))
        .slice(0, 4)
        .flatMap((p) => {
          const biz = demoBusinessById.get(p.business_id);
          if (!biz) return [];
          return [{ type: "product" as const, key: `prod-${p.id}`, label: p.name, sublabel: `En ${biz.name}`, href: `/product/${p.id}` }];
        });

      let realMatches: Suggestion[] = [];
      let realProductMatches: Suggestion[] = [];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const isDemo = !supabaseUrl || supabaseUrl.includes("your-project") || supabaseUrl === "https://placeholder.supabase.co";
      if (!isDemo) {
        const supabase = createClient();
        const safeTerm = term.replace(/[,()]/g, " ").trim();
        const { data } = await supabase
          .from("businesses")
          .select("id, name, category")
          .eq("is_approved", true).eq("is_active", true)
          .or(`name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%,category.ilike.%${safeTerm}%`)
          .limit(5);
        realMatches = (data ?? []).map((b) => ({ type: "business" as const, key: `biz-${b.id}`, label: b.name, sublabel: b.category, href: `/business/${b.id}` }));

        const { data: productData } = await supabase
          .from("products")
          .select("id, name, businesses!inner(name, is_approved, is_active)")
          .eq("is_available", true)
          .eq("businesses.is_approved", true)
          .eq("businesses.is_active", true)
          .ilike("name", `%${safeTerm}%`)
          .limit(4);
        realProductMatches = ((productData ?? []) as unknown as { id: string; name: string; businesses: { name: string } }[])
          .map((p) => ({ type: "product" as const, key: `prod-${p.id}`, label: p.name, sublabel: `En ${p.businesses.name}`, href: `/product/${p.id}` }));
      }

      if (cancelled) return;
      const merged = [...demoProductMatches, ...realProductMatches, ...categoryMatches, ...demoMatches, ...realMatches].slice(0, 8);
      setSuggestions(merged);
      setOpen(merged.length > 0);
    }, 250);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [value, categoriesFlat]);

  const goTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    router.push(`/?q=${encodeURIComponent(value)}`);
  };

  return (
    <div ref={containerRef} className="relative max-w-xl mx-auto mb-8">
      <form onSubmit={submitSearch}>
        <div className="flex gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 shadow-xl">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              name="q"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder="Buscar productos o tiendas..."
              autoComplete="off"
              className="flex-1 outline-none bg-transparent text-white placeholder-gray-400 text-sm"
            />
          </div>
          <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Buscar
          </button>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 top-full mt-2 w-full bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden text-left">
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => goTo(s.href)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              {s.type === "category" ? (
                <Tag className="w-4 h-4 text-brand-500 flex-shrink-0" />
              ) : s.type === "product" ? (
                <Package className="w-4 h-4 text-brand-500 flex-shrink-0" />
              ) : (
                <Store className="w-4 h-4 text-brand-500 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{s.label}</p>
                <p className="text-xs text-slate-400 truncate">{s.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
