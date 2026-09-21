"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildCategoryTree, CategoryFlat, CategoryWithChildren } from "@/lib/categories";

interface Categories {
  tree: CategoryWithChildren[];
  flat: CategoryFlat[];
  loading: boolean;
  /** Inserta una categoría recién creada en el árbol local, sin re-consultar todo. */
  addCreated: (created: { id: string; name: string }, parentId: string | null) => void;
  refetch: () => void;
}

export function useCategories(): Categories {
  const [flat, setFlat] = useState<CategoryFlat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const supabase = createClient();
    supabase.from("categories").select("id, name, parent_id").order("name").then(({ data }) => {
      setFlat((data ?? []) as CategoryFlat[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCreated = useCallback((created: { id: string; name: string }, parentId: string | null) => {
    setFlat((prev) => [...prev, { id: created.id, name: created.name, parent_id: parentId }]);
  }, []);

  return { tree: buildCategoryTree(flat), flat, loading, addCreated, refetch: load };
}
