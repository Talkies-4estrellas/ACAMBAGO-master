// Historial de categorías vistas recientemente en /productos, guardado en el
// navegador (localStorage), sin backend: cada vez que el usuario filtra por
// una categoría se agrega al frente, deduplicada, tope de MAX_ITEMS. A
// diferencia de "vistos recientemente" de productos, no expira por fecha —
// mientras el usuario siga usando el catálogo, su historial de categorías se
// mantiene tal cual.

const STORAGE_KEY = "recently_viewed_categories";
const MAX_ITEMS = 6;

export function trackCategoryView(category: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentCategories();
    const updated = [category, ...current.filter((c) => c !== category)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage no disponible (modo privado, etc.); no es critico, se ignora.
  }
}

export function getRecentCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

// Para leer el historial como "sistema externo" vía useSyncExternalStore en
// vez de un useEffect+setState (evita renders en cascada): getSnapshot debe
// devolver un string estable, no un array nuevo en cada llamada.
export function getRecentCategoriesSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

// Solo cambia entre pestañas (evento "storage"); en la misma pestaña, un
// clic en una categoría navega y remonta la página, que vuelve a leer el
// historial actualizado desde cero.
export function subscribeToRecentCategories(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
