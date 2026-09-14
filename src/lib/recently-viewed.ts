// Historial de "vistos recientemente" guardado en el navegador (localStorage),
// sin backend: cada visita a un producto se agrega al frente, deduplicada por
// id, tope de 12 productos. Cada producto se guarda con la fecha en que se
// vio y se descarta automáticamente pasados 7 días (se "reinicia" solo, sin
// necesidad de ningún proceso en segundo plano: se filtra cada vez que se lee).

export interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  business_id: string;
  business_name: string;
  business_category: string;
}

interface StoredItem extends RecentlyViewedItem {
  viewedAt: number;
}

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 12;
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function readValid(): StoredItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredItem[];
    const cutoff = Date.now() - EXPIRY_MS;
    return stored.filter((p) => (p.viewedAt ?? 0) > cutoff);
  } catch {
    return [];
  }
}

export function trackRecentlyViewed(item: RecentlyViewedItem): void {
  if (typeof window === "undefined") return;
  try {
    const current = readValid();
    const withoutCurrent = current.filter((p) => p.id !== item.id);
    const updated: StoredItem[] = [{ ...item, viewedAt: Date.now() }, ...withoutCurrent].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage no disponible (modo privado, etc.); no es critico, se ignora.
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const valid = readValid();
    // Auto-limpieza: si algún producto ya expiró, se vuelve a guardar la
    // lista sin él para no tener que re-filtrar la basura en cada lectura.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    return valid;
  } catch {
    return [];
  }
}
