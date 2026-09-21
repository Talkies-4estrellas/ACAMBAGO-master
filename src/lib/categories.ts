import type { SupabaseClient } from "@supabase/supabase-js";

// Sistema dinámico de categorías con jerarquía padre/hijo, portado del
// comportamiento (no del componente) de un proyecto hermano — aquí el
// almacenamiento sigue siendo por nombre (texto), nunca por id, en
// businesses.category y products.categories, para no tener que tocar todo
// lo que ya filtra por nombre plano (.contains(), /category/[nombre], etc).

export interface CategoryFlat {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface CategoryChild {
  id: string;
  name: string;
}

export interface CategoryWithChildren {
  id: string;
  name: string;
  children: CategoryChild[];
}

/** Quita espacios sobrantes al inicio/fin y colapsa espacios dobles. */
export function normalizeCategoryName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Primera letra en mayúscula, el resto igual — para categorías nuevas creadas al vuelo. */
function capitalizeCategoryName(raw: string): string {
  const clean = normalizeCategoryName(raw);
  if (!clean) return clean;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Agrupa la lista plana (como viene de Supabase) en padres con su arreglo de hijos, ambos ordenados alfabéticamente. */
export function buildCategoryTree(flat: CategoryFlat[]): CategoryWithChildren[] {
  const parents = flat.filter((c) => c.parent_id === null);
  return parents
    .map((p) => ({
      id: p.id,
      name: p.name,
      children: flat
        .filter((c) => c.parent_id === p.id)
        .map((h) => ({ id: h.id, name: h.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Busca una categoría por nombre sin distinguir mayúsculas/minúsculas,
 * escapada al padre dado (raíz si es null); si no existe, la crea. Pensada
 * para el "+ Nueva" del selector — un vendedor cualquiera puede crear una,
 * sin aprobación de admin (ver comentario en supabase/categories.sql).
 */
export async function findOrCreateCategory(
  supabase: SupabaseClient,
  rawName: string,
  parentId: string | null
): Promise<{ id: string; name: string } | null> {
  const name = capitalizeCategoryName(rawName);
  if (!name) return null;

  const query = parentId === null
    ? supabase.from("categories").select("id, name").is("parent_id", null).ilike("name", name)
    : supabase.from("categories").select("id, name").eq("parent_id", parentId).ilike("name", name);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, parent_id: parentId })
    .select("id, name")
    .single();
  if (!error && data) return data;

  // Otro vendedor pudo haber creado la misma categoría al mismo tiempo
  // (choque contra el índice único) — se reintenta la búsqueda antes de rendirse.
  const retryQuery = parentId === null
    ? supabase.from("categories").select("id, name").is("parent_id", null).ilike("name", name)
    : supabase.from("categories").select("id, name").eq("parent_id", parentId).ilike("name", name);
  const { data: retry } = await retryQuery.maybeSingle();
  return retry ?? null;
}

/** Trae el árbol completo de categorías. Server-safe (sin "use client") — para páginas que ya hacen fetch en servidor. */
export async function getCategoryTree(supabase: SupabaseClient): Promise<CategoryWithChildren[]> {
  const { data } = await supabase.from("categories").select("id, name, parent_id").order("name");
  return buildCategoryTree((data ?? []) as CategoryFlat[]);
}
