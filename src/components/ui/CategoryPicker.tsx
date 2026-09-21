"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { findOrCreateCategory, CategoryWithChildren } from "@/lib/categories";

export type CategoryPick = { parentId: string; childId: string | null };

interface Option {
  id: string;
  name: string;
}

// Cuadro de texto con autocompletado: filtra las opciones mientras se
// escribe, abre al enfocar, Escape cierra, Enter elige si hay una sola
// coincidencia. Portado del comportamiento (no del componente literal) de
// un proyecto hermano — aquí a clases de Tailwind en vez de style inline.
function ComboBox({
  query, onQueryChange, options, onSelect, onClose, placeholder, noResultsHint,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  options: Option[];
  onSelect: (opt: Option) => void;
  onClose: () => void;
  placeholder: string;
  noResultsHint: string;
}) {
  const [open, setOpen] = useState(false);
  // Al enfocar con una categoría ya elegida, el query trae su nombre — sin
  // esto, el filtro de abajo solo encontraría a esa misma opción, ocultando
  // el resto. Se muestran todas hasta que la persona escriba algo distinto.
  const [showAll, setShowAll] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (showAll) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query, showAll]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onClose();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0">
      <input
        value={query}
        onChange={(e) => { onQueryChange(e.target.value); setShowAll(false); setOpen(true); }}
        onFocus={(e) => { setOpen(true); setShowAll(true); e.target.select(); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); onClose(); }
          if (e.key === "Enter" && filtered.length === 1) { e.preventDefault(); onSelect(filtered[0]); setOpen(false); }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="input"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{noResultsHint}</p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(opt); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                {opt.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const SIN_SUBCATEGORIA = "__sin_subcategoria__";

/** Un renglón: categoría (padre) + subcategoría opcional, cada una con su propio "+ Nueva". */
function CategoryPickRow({
  tree, pick, onChange, allowSubcategory, onCategoryCreated, onRemove,
}: {
  tree: CategoryWithChildren[];
  pick: CategoryPick;
  onChange: (pick: CategoryPick) => void;
  allowSubcategory: boolean;
  onCategoryCreated: (created: { id: string; name: string }, parentId: string | null) => void;
  onRemove?: () => void;
}) {
  const [creatingParent, setCreatingParent] = useState(false);
  const [newParentName, setNewParentName] = useState("");
  const [creatingChild, setCreatingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [saving, setSaving] = useState(false);

  const parent = tree.find((p) => p.id === pick.parentId) ?? null;
  const child = parent?.children.find((c) => c.id === pick.childId) ?? null;

  // Sincroniza el texto mostrado con la selección real cuando cambia desde
  // afuera (se eligió otra opción, se creó una nueva, se limpió) — ajuste
  // durante el render en vez de un efecto, siguiendo el patrón de React
  // para "resetear estado cuando cambia una prop" sin viejo/nuevo useEffect.
  const [parentQuery, setParentQuery] = useState(parent?.name ?? "");
  const [lastParentId, setLastParentId] = useState(parent?.id ?? null);
  if ((parent?.id ?? null) !== lastParentId) {
    setLastParentId(parent?.id ?? null);
    setParentQuery(parent?.name ?? "");
  }

  const [childQuery, setChildQuery] = useState(child?.name ?? "");
  const [lastChildId, setLastChildId] = useState(child?.id ?? null);
  if ((child?.id ?? null) !== lastChildId) {
    setLastChildId(child?.id ?? null);
    setChildQuery(child?.name ?? "");
  }

  async function createParent() {
    if (!newParentName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const created = await findOrCreateCategory(supabase, newParentName, null);
    setSaving(false);
    if (!created) { toast.error("No se pudo crear la categoría"); return; }
    onCategoryCreated(created, null);
    onChange({ parentId: created.id, childId: null });
    setCreatingParent(false);
    setNewParentName("");
  }

  async function createChild() {
    if (!newChildName.trim() || !parent) return;
    setSaving(true);
    const supabase = createClient();
    const created = await findOrCreateCategory(supabase, newChildName, parent.id);
    setSaving(false);
    if (!created) { toast.error("No se pudo crear la subcategoría"); return; }
    onCategoryCreated(created, parent.id);
    onChange({ parentId: parent.id, childId: created.id });
    setCreatingChild(false);
    setNewChildName("");
  }

  const childOptions: Option[] = child
    ? [{ id: SIN_SUBCATEGORIA, name: "— Sin subcategoría —" }, ...(parent?.children ?? [])]
    : parent?.children ?? [];

  return (
    <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center gap-2">
        {!creatingParent ? (
          <>
            <ComboBox
              query={parentQuery}
              onQueryChange={setParentQuery}
              options={tree}
              onSelect={(opt) => onChange({ parentId: opt.id, childId: null })}
              onClose={() => setParentQuery(parent?.name ?? "")}
              placeholder="Buscar categoría..."
              noResultsHint='No existe — usa "+ Nueva" para crearla'
            />
            <button type="button" onClick={() => setCreatingParent(true)} className="btn-secondary text-xs px-2.5 py-1.5 flex-shrink-0 whitespace-nowrap">+ Nueva</button>
          </>
        ) : (
          <>
            <input
              autoFocus value={newParentName} disabled={saving}
              onChange={(e) => setNewParentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); createParent(); }
                if (e.key === "Escape") setCreatingParent(false);
              }}
              placeholder="Nombre de la categoría..." className="input flex-1"
            />
            <button type="button" onClick={createParent} disabled={saving} className="btn-primary text-xs px-2.5 py-1.5 flex-shrink-0">{saving ? "..." : "Guardar"}</button>
            <button type="button" onClick={() => setCreatingParent(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"><X className="w-4 h-4" /></button>
          </>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} title="Quitar categoría" className="p-1.5 text-slate-400 hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
        )}
      </div>

      {allowSubcategory && parent && (
        <div className="flex items-center gap-2 pl-4">
          {!creatingChild ? (
            <>
              <ComboBox
                query={childQuery}
                onQueryChange={setChildQuery}
                options={childOptions}
                onSelect={(opt) => onChange({ parentId: parent.id, childId: opt.id === SIN_SUBCATEGORIA ? null : opt.id })}
                onClose={() => setChildQuery(child?.name ?? "")}
                placeholder="Subcategoría (opcional)..."
                noResultsHint='No existe — usa "+ Nueva" para crearla'
              />
              <button type="button" onClick={() => setCreatingChild(true)} className="btn-secondary text-xs px-2.5 py-1.5 flex-shrink-0 whitespace-nowrap">+ Nueva</button>
            </>
          ) : (
            <>
              <input
                autoFocus value={newChildName} disabled={saving}
                onChange={(e) => setNewChildName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); createChild(); }
                  if (e.key === "Escape") setCreatingChild(false);
                }}
                placeholder="Nombre de la subcategoría..." className="input flex-1"
              />
              <button type="button" onClick={createChild} disabled={saving} className="btn-primary text-xs px-2.5 py-1.5 flex-shrink-0">{saving ? "..." : "Guardar"}</button>
              <button type="button" onClick={() => setCreatingChild(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"><X className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type Props =
  | {
      mode: "single";
      tree: CategoryWithChildren[];
      value: CategoryPick | null;
      onChange: (pick: CategoryPick) => void;
      allowSubcategory?: boolean;
      onCategoryCreated?: (created: { id: string; name: string }, parentId: string | null) => void;
    }
  | {
      mode: "multi";
      tree: CategoryWithChildren[];
      value: CategoryPick[];
      onChange: (picks: CategoryPick[]) => void;
      onCategoryCreated?: (created: { id: string; name: string }, parentId: string | null) => void;
    };

const EMPTY_PICK: CategoryPick = { parentId: "", childId: null };
const NOOP = () => {};

export default function CategoryPicker(props: Props) {
  if (props.mode === "single") {
    const { tree, value, onChange, allowSubcategory = true, onCategoryCreated } = props;
    return (
      <CategoryPickRow
        tree={tree}
        pick={value ?? EMPTY_PICK}
        allowSubcategory={allowSubcategory}
        onChange={onChange}
        onCategoryCreated={onCategoryCreated ?? NOOP}
      />
    );
  }

  const { tree, value, onChange, onCategoryCreated } = props;
  return (
    <div className="space-y-2">
      {value.map((pick, i) => (
        <CategoryPickRow
          key={i}
          tree={tree}
          pick={pick}
          allowSubcategory
          onChange={(p) => onChange(value.map((v, idx) => (idx === i ? p : v)))}
          onCategoryCreated={onCategoryCreated ?? NOOP}
          onRemove={() => onChange(value.filter((_, idx) => idx !== i))}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, EMPTY_PICK])}
        className="text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Agregar categoría
      </button>
    </div>
  );
}

/** Convierte los picks (padre/hijo) a los nombres que se guardan en la base — hoja + su padre cuando aplica. */
export function picksToNames(picks: CategoryPick[], tree: CategoryWithChildren[]): string[] {
  const names = picks.flatMap((pick) => {
    const parent = tree.find((p) => p.id === pick.parentId);
    if (!parent) return [];
    const child = pick.childId ? parent.children.find((c) => c.id === pick.childId) : null;
    return child ? [parent.name, child.name] : [parent.name];
  });
  return Array.from(new Set(names));
}

/** Convierte nombres guardados (planos) de vuelta a picks — junta un hijo con su padre cuando ambos nombres están presentes. */
export function namesToPicks(names: string[], tree: CategoryWithChildren[]): CategoryPick[] {
  const remaining = new Set(names);
  const picks: CategoryPick[] = [];

  for (const parent of tree) {
    for (const child of parent.children) {
      if (remaining.has(child.name)) {
        picks.push({ parentId: parent.id, childId: child.id });
        remaining.delete(child.name);
        remaining.delete(parent.name);
      }
    }
  }
  for (const parent of tree) {
    if (remaining.has(parent.name)) {
      picks.push({ parentId: parent.id, childId: null });
      remaining.delete(parent.name);
    }
  }
  return picks;
}
