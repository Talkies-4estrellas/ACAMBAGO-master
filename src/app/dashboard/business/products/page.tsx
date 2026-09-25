"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/types";
import { Plus, Pencil, Trash2, Package, Upload, X, AlertCircle, PauseCircle, PlayCircle, LayoutGrid, List, Search } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import { loadOwnedBusinesses } from "@/lib/current-business";
import NotificationBellDropdown from "@/components/ui/NotificationBellDropdown";
import CategoryPicker, { CategoryPick, picksToNames, namesToPicks } from "@/components/ui/CategoryPicker";
import { useCategories } from "@/lib/hooks/use-categories";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";
const MAX_IMAGES = 10;
// 5 columnas x 10 renglones por página, para cuando haya muchos productos.
const PRODUCTS_PER_PAGE = 50;

type ProductSort = "subida_desc" | "subida_asc" | "nombre_asc" | "nombre_desc";

const SORT_OPTIONS: { id: ProductSort; label: string }[] = [
  { id: "subida_desc", label: "Subida: más reciente primero" },
  { id: "subida_asc", label: "Subida: más antiguo primero" },
  { id: "nombre_asc", label: "Nombre: A-Z" },
  { id: "nombre_desc", label: "Nombre: Z-A" },
];

function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    switch (sort) {
      case "nombre_asc": return a.name.localeCompare(b.name, "es");
      case "nombre_desc": return b.name.localeCompare(a.name, "es");
      case "subida_asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  return sorted;
}

interface ImageSlot {
  url?: string;   // ya subida a Storage
  file?: File;    // pendiente de subir
  preview: string;
}

/** Convierte cualquier foto a WebP antes de subirla (mismo criterio que el
 * logo/banner en ImageCropUpload.tsx) — incluye HEIC (fotos de iPhone), que
 * primero se pasan a JPEG porque el canvas no puede leer ese formato directo.
 * Si algo falla, se sube el archivo original tal cual, nunca se bloquea la venta. */
async function convertToWebp(file: File): Promise<Blob> {
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  let sourceBlob: Blob = file;
  if (isHeic) {
    const convert = (await import("heic-convert/browser")).default;
    const buffer = await file.arrayBuffer();
    const output = await convert({ buffer: new Uint8Array(buffer), format: "JPEG", quality: 0.9 });
    sourceBlob = new Blob([output as BlobPart], { type: "image/jpeg" });
  }

  const url = URL.createObjectURL(sourceBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la imagen");
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      // Si el navegador no sabe codificar webp, cae solo a png (comportamiento
      // nativo de toBlob) — el nombre/extensión final se decide leyendo
      // blob.type en el momento de subir, nunca asumiendo que sí quedó en webp.
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo convertir la imagen"))), "image/webp", 0.85);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lo que le falta al precio escrito para completar 2 decimales — el
 * "fantasma" que se muestra en gris después de lo que el vendedor ya
 * escribió, y que desaparece en cuanto él mismo pone sus propios decimales. */
function priceGhostSuffix(raw: string): string {
  if (!raw) return "";
  const dotIndex = raw.indexOf(".");
  if (dotIndex === -1) return ".00";
  const decimals = raw.slice(dotIndex + 1);
  if (decimals.length === 0) return "00";
  if (decimals.length === 1) return "0";
  return "";
}

/** "Foto" del estado del formulario en un momento dado, para poder comparar
 * si algo cambió desde que se abrió el modal de editar. El orden de las
 * fotos importa (la primera es la portada, reordenar SÍ es un cambio real);
 * el orden de las categorías no, así que se ordenan antes de comparar. */
function buildFormSnapshot(data: { name: string; description: string; price: string; stock: string; depositAmount: string; categoryNames: string[]; imageUrls: string[] }): string {
  return JSON.stringify({
    name: data.name,
    description: data.description,
    price: data.price,
    stock: data.stock,
    depositAmount: data.depositAmount,
    categories: [...data.categoryNames].sort(),
    images: data.imageUrls,
  });
}

/** Mismo umbral (0 = agotado, ≤5 = poco) para el badge de la tarjeta y la
 * celda de cantidad de la vista de lista — un solo lugar decide qué cuenta
 * como "poco stock". */
function stockTone(stock?: number | null): "none" | "out" | "low" | "ok" {
  if (stock == null) return "none";
  if (stock === 0) return "out";
  if (stock <= 5) return "low";
  return "ok";
}

function StockBadge({ stock }: { stock?: number }) {
  const tone = stockTone(stock);
  if (tone === "none") return null;
  if (tone === "out") {
    return <span className="absolute top-2 left-2 text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full">Agotado</span>;
  }
  if (tone === "low") {
    return <span className="absolute top-2 left-2 text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">Últimas {stock}</span>;
  }
  return <span className="absolute top-2 left-2 text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">{stock} en stock</span>;
}

/** Igual que StockBadge pero como texto de celda, para la vista de lista. */
function StockCell({ stock }: { stock?: number | null }) {
  const tone = stockTone(stock);
  if (tone === "none") return <span className="text-slate-400 dark:text-slate-500">—</span>;
  if (tone === "out") return <span className="text-red-600 dark:text-red-400 font-medium">Agotado</span>;
  if (tone === "low") return <span className="text-amber-600 dark:text-amber-400 font-medium">{stock}</span>;
  return <span className="text-slate-600 dark:text-slate-300">{stock}</span>;
}

/** Estado de publicación de un producto, como pastilla — para la columna
 * "Estado" de la vista de lista (la tarjeta ya lo muestra sobre la foto). */
function StatusBadge({ p }: { p: Product }) {
  if (p.is_draft) {
    return <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full whitespace-nowrap">Borrador</span>;
  }
  if (p.is_available === false) {
    return <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap">Pausado</span>;
  }
  return <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">Activo</span>;
}

export default function ProductsPage() {
  const { user, isLoaded } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessCategory, setBusinessCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [picks, setPicks] = useState<CategoryPick[]>([]);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"todos" | "agotados">("todos");
  // Tarjetas (como hoy) o lista tipo Excel/punto de venta, una fila por producto.
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<ProductSort>("subida_desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Selección para acciones en lote (solo vista de lista, por ahora).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggingOverImages, setDraggingOverImages] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(null);
  // Foto del formulario al abrir "Editar", para saber si hubo cambios reales
  // cuando se hace clic fuera del recuadro (no se necesita al crear, ahí el
  // clic afuera simplemente no hace nada).
  const initialSnapshotRef = useRef<string>("");

  const supabase = createClient();
  const { tree: categoryTree, addCreated } = useCategories();

  useEffect(() => {
    const load = async () => {
      if (IS_DEMO) {
        setProducts(DEMO_PRODUCTS as unknown as Product[]);
        setBusinessId("demo");
        setLoaded(true);
        return;
      }
      if (!isLoaded || !user) return;
      const { active: biz } = await loadOwnedBusinesses(supabase, user.id);
      if (!biz) {
        window.location.href = "/perfil/crear-tienda";
        return;
      }
      setBusinessId(biz.id);
      setBusinessCategory(biz.category);
      const { data } = await supabase.from("products").select("*").eq("business_id", biz.id).order("created_at", { ascending: false });
      setProducts((data ?? []) as Product[]);
      setLoaded(true);
    };
    load();
  }, [isLoaded, user?.id]);

  const openNew = () => {
    if (IS_DEMO) { toast("Conecta Supabase para agregar productos reales", { icon: "ℹ️" }); return; }
    setEditing(null); setName(""); setDescription(""); setPrice(""); setStock(""); setDepositAmount("");
    setPicks(businessCategory ? namesToPicks([businessCategory], categoryTree) : []);
    setImages([]); setShowForm(true);
  };

  const openEdit = (p: Product) => {
    if (IS_DEMO) { toast("Conecta Supabase para editar productos", { icon: "ℹ️" }); return; }
    setEditing(p); setName(p.name); setDescription(p.description ?? "");
    setPrice(String(p.price));
    setStock(p.stock_quantity != null ? String(p.stock_quantity) : "");
    setDepositAmount(p.deposit_amount != null ? String(p.deposit_amount) : "");
    const names = p.categories?.length ? p.categories : businessCategory ? [businessCategory] : [];
    setPicks(namesToPicks(names, categoryTree));
    const existing = p.image_urls?.length ? p.image_urls : p.image_url ? [p.image_url] : [];
    setImages(existing.map((url) => ({ url, preview: url })));
    setShowForm(true);
    initialSnapshotRef.current = buildFormSnapshot({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      stock: p.stock_quantity != null ? String(p.stock_quantity) : "",
      depositAmount: p.deposit_amount != null ? String(p.deposit_amount) : "",
      categoryNames: names,
      imageUrls: existing,
    });
  };

  /** true si algo del formulario cambió desde que se abrió "Editar". */
  const hasUnsavedChanges = () => {
    const currentImages = images.map((img) => img.url ?? `nueva:${img.file?.name}-${img.file?.size}`);
    const current = buildFormSnapshot({
      name, description, price, stock, depositAmount,
      categoryNames: picksToNames(picks, categoryTree),
      imageUrls: currentImages,
    });
    return current !== initialSnapshotRef.current;
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Reordena arrastrando una foto ya subida sobre otra — la que queda
  // primera es la portada (ya lo decide el resto del código con i === 0).
  const moveImage = (from: number, to: number) => {
    if (from === to) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDropImages = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingOverImages(false);
    // Si lo que se soltó es una foto ya subida (se estaba reordenando), no
    // se agrega como archivo nuevo — antes esto duplicaba la foto porque el
    // navegador también manda la imagen arrastrada en dataTransfer.files.
    if (draggingImageIndex !== null) {
      moveImage(draggingImageIndex, images.length - 1);
      setDraggingImageIndex(null);
      return;
    }
    addFiles(e.dataTransfer.files);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSave();
  };

  const performSave = async () => {
    if (!businessId) {
      toast.error("No se encontró tu negocio. Recarga la página.");
      return;
    }
    setSaving(true);
    const categories = picksToNames(picks, categoryTree);
    // El precio ya no bloquea guardar si se deja vacío — solo decide, junto
    // con fotos/cantidad/categoría, si el producto queda como borrador.
    const priceValue = price === "" ? 0 : parseFloat(price) || 0;

    // NULL = este producto no admite apartado. El CHECK de la base es el
    // respaldo real; esto solo evita un viaje al servidor con un dato que
    // ya sabemos invalido.
    const deposit_amount = depositAmount === "" ? null : parseFloat(depositAmount);
    if (deposit_amount != null && (isNaN(deposit_amount) || deposit_amount <= 0 || deposit_amount > priceValue)) {
      toast.error("El anticipo de apartado debe ser mayor a cero y no puede superar el precio del producto");
      setSaving(false);
      return;
    }

    const finalUrls: string[] = [];
    for (const img of images) {
      if (img.url) {
        finalUrls.push(img.url);
        continue;
      }
      if (img.file) {
        let uploadBlob: Blob = img.file;
        let ext = img.file.name.split(".").pop() ?? "jpg";
        try {
          uploadBlob = await convertToWebp(img.file);
          if (uploadBlob.type === "image/webp") ext = "webp";
        } catch {
          // Si la conversión falla, se sube el archivo original tal cual —
          // nunca debe tumbar la publicación del producto por esto.
        }
        const path = `${businessId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, uploadBlob, { upsert: true, contentType: uploadBlob.type });
        if (uploadErr) {
          toast.error(`Error al subir una imagen: ${uploadErr.message}`);
          setSaving(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
        finalUrls.push(publicUrl);
      }
    }

    const image_url = finalUrls[0];
    const image_urls = finalUrls;
    const stock_quantity = stock === "" ? null : parseInt(stock, 10);

    // Mínimo para que el producto se muestre al público: al menos 1 foto,
    // precio y categoría. Si falta algo, se guarda igual pero como borrador
    // (is_draft) — nunca se bloquea el guardado por esto. Cantidad NO
    // cuenta: dejarla vacía es una elección válida ("no llevo inventario"),
    // no un dato incompleto.
    const is_draft = !(finalUrls.length > 0 && priceValue > 0 && categories.length > 0);

    if (editing) {
      // Fotos que estaban en el producto original y ya no quedaron en
      // finalUrls (el usuario las quitó y/o las reemplazó) — hay que
      // borrarlas de Storage también, o quedan huérfanas para siempre.
      const originalUrls: string[] = editing.image_urls?.length ? editing.image_urls : editing.image_url ? [editing.image_url] : [];
      const removedUrls = originalUrls.filter((url) => !finalUrls.includes(url));

      const { error } = await supabase.from("products").update({ name, description, price: priceValue, image_url, image_urls, stock_quantity, deposit_amount, categories, is_draft }).eq("id", editing.id);
      if (error) {
        toast.error(`Error al actualizar: ${error.message}`);
      } else {
        setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, name, description, price: priceValue, image_url, image_urls, stock_quantity: stock_quantity ?? undefined, deposit_amount: deposit_amount ?? undefined, categories, is_draft } : p));
        toast.success(is_draft ? "Producto actualizado como borrador: aún no se muestra a tus clientes" : "Producto actualizado");
        setShowForm(false);

        if (removedUrls.length > 0) {
          fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: editing.id, urls: removedUrls }),
          }).catch(() => {});
        }
      }
    } else {
      const { data, error } = await supabase.from("products").insert({ business_id: businessId, name, description, price: priceValue, image_url, image_urls, stock_quantity, deposit_amount, categories, is_draft }).select().single();
      if (error) {
        toast.error(`Error al guardar: ${error.message}`);
      } else if (data) {
        setProducts((prev) => [data as Product, ...prev]);
        toast.success(is_draft ? "Producto guardado como borrador: complétalo para que se muestre a tus clientes" : "Producto agregado");
        setShowForm(false);
      }
    }

    setSaving(false);
  };

  const handleToggleAvailability = async (p: Product) => {
    if (IS_DEMO) { toast("Conecta Supabase para pausar productos reales", { icon: "ℹ️" }); return; }
    const is_available = !p.is_available;
    const { error } = await supabase.from("products").update({ is_available }).eq("id", p.id);
    if (error) {
      toast.error("No se pudo actualizar el producto");
      return;
    }
    setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, is_available } : item)));
    toast.success(is_available ? "Producto activado, ya se ve en tu tienda" : "Producto pausado, no se ve en tu tienda");
  };

  const handleDelete = async (p: Product) => {
    if (IS_DEMO) { toast("Conecta Supabase para eliminar productos", { icon: "ℹ️" }); return; }
    if (!confirm("¿Eliminar este producto?")) return;

    // Por una ruta de API, no directo desde el navegador: borrar las fotos
    // en Storage necesita la service role — la llave anónima del cliente
    // solo tiene permiso de INSERT/SELECT en el bucket product-images, no
    // DELETE (confirmado en vivo, da 403).
    const res = await fetch(`/api/products?id=${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo eliminar el producto");
      return;
    }
    setProducts((prev) => prev.filter((item) => item.id !== p.id));
    toast.success("Producto eliminado");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const bulkSetAvailability = async (is_available: boolean) => {
    if (IS_DEMO) { toast("Conecta Supabase para actualizar productos reales", { icon: "ℹ️" }); return; }
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("products").update({ is_available }).in("id", ids);
    if (error) { toast.error("No se pudieron actualizar los productos"); return; }
    setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, is_available } : p)));
    setSelectedIds(new Set());
    toast.success(is_available ? `${ids.length} producto${ids.length === 1 ? "" : "s"} activado${ids.length === 1 ? "" : "s"}` : `${ids.length} producto${ids.length === 1 ? "" : "s"} pausado${ids.length === 1 ? "" : "s"}`);
  };

  const bulkDelete = async () => {
    if (IS_DEMO) { toast("Conecta Supabase para eliminar productos", { icon: "ℹ️" }); return; }
    const ids = Array.from(selectedIds);
    if (!confirm(`¿Eliminar ${ids.length} producto${ids.length === 1 ? "" : "s"}? Esto no se puede deshacer.`)) return;

    const results = await Promise.all(
      ids.map(async (id) => ({ id, ok: (await fetch(`/api/products?id=${id}`, { method: "DELETE" })).ok }))
    );
    const succeededIds = results.filter((r) => r.ok).map((r) => r.id);
    const failedCount = results.length - succeededIds.length;

    setProducts((prev) => prev.filter((p) => !succeededIds.includes(p.id)));
    setSelectedIds(new Set());
    if (succeededIds.length > 0) toast.success(`${succeededIds.length} producto${succeededIds.length === 1 ? "" : "s"} eliminado${succeededIds.length === 1 ? "" : "s"}`);
    if (failedCount > 0) toast.error(`${failedCount} producto${failedCount === 1 ? "" : "s"} no se pudo${failedCount === 1 ? "" : "n"} eliminar`);
  };

  const searchTerm = search.trim().toLowerCase();
  const filteredProducts = sortProducts(
    products.filter((p) => (tab === "todos" || p.stock_quantity === 0) && (!searchTerm || p.name.toLowerCase().includes(searchTerm))),
    sort
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Productos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{products.length} productos publicados</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Solo escritorio: en móvil ya está la campana de la barra
              superior (dashboard/layout.tsx), fija en todas las pantallas
              del panel. */}
          {!IS_DEMO && user?.id && (
            <div className="hidden lg:block">
              <NotificationBellDropdown userId={user.id} viewAllHref="/dashboard/business/notificaciones" />
            </div>
          )}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              title="Vista de tarjetas"
              aria-label="Vista de tarjetas"
              className={`p-1.5 rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              title="Vista de lista"
              aria-label="Vista de lista"
              className={`p-1.5 rounded-lg transition-colors ${
                view === "list"
                  ? "bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={openNew}
            className="btn-primary flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar producto
          </button>
        </div>
      </div>

      {/* Buscador por nombre */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }}
          placeholder="Buscar por nombre..."
          className="input pl-10"
        />
      </div>

      {/* Tabs + orden */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {products.some((p) => p.stock_quantity === 0) ? (
          <div className="flex gap-2">
            {[
              { id: "todos" as const, label: "Todos" },
              { id: "agotados" as const, label: "Agotados" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPage(1); setSelectedIds(new Set()); }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : <div />}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as ProductSort); setPage(1); }}
          className="text-sm rounded-full px-3.5 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-none outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Demo banner */}
      {IS_DEMO && (
        <div className="card p-4 mb-6 flex items-start gap-3 border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/5">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Modo demo activo</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Los productos mostrados son de demostración. Conecta Supabase para agregar, editar y eliminar productos reales.</p>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            // Al crear: un clic afuera no debe borrar lo ya escrito, así
            // que no hace nada — hay que usar "Cancelar" o la X a propósito.
            if (!editing) return;
            // Al editar: si no cambió nada, cerrar directo; si cambió algo,
            // preguntar si guardar o descartar antes de cerrar.
            if (!hasUnsavedChanges()) { setShowForm(false); return; }
            if (confirm("Tienes cambios sin guardar en este producto. Aceptar para guardarlos, Cancelar para descartarlos.")) {
              performSave();
            } else {
              setShowForm(false);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                {editing ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-600 dark:text-gray-300" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Images */}
              <div>
                <label className="label">Fotos del producto ({images.length}/{MAX_IMAGES})</label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => setDraggingImageIndex(i)}
                      onDragEnd={() => setDraggingImageIndex(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingImageIndex !== null) moveImage(draggingImageIndex, i);
                        setDraggingImageIndex(null);
                      }}
                      className={`relative h-24 rounded-xl overflow-hidden border cursor-move transition-opacity bg-slate-50 dark:bg-white/5 ${
                        draggingImageIndex === i ? "opacity-40" : ""
                      } border-slate-200 dark:border-white/10`}
                      title="Arrastra para cambiar el orden"
                    >
                      <Image src={img.preview} alt={`Foto ${i + 1}`} fill draggable={false} className="object-contain pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-brand-500 text-white px-1.5 py-0.5 rounded-full">Portada</span>
                      )}
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <div
                      onClick={() => document.getElementById("product-image-input")?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDraggingOverImages(true); }}
                      onDragLeave={() => setDraggingOverImages(false)}
                      onDrop={handleDropImages}
                      className={`h-24 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                        draggingOverImages
                          ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10 text-brand-500"
                          : "border-slate-200 dark:border-white/20 hover:border-brand-400 dark:hover:border-brand-500 text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      <p className="text-[10px] font-medium">Agregar foto</p>
                      <p className="text-[9px]">o arrastra aquí</p>
                    </div>
                  )}
                </div>
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">La primera foto es la portada. JPG, PNG — máx. 5 MB c/u.</p>
              </div>

              <div>
                <label className="label">Nombre del producto *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ej: Taladro percutor, Servicio de pintura..." />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input resize-none" rows={2} placeholder="Descripción breve del producto" />
              </div>
              <div>
                <label className="label">Precio (MXN)</label>
                <div className="relative w-full bg-white border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all duration-200 dark:bg-white/10 dark:border-white/20">
                  {/* Capa fantasma: mismo texto ya escrito (invisible) + lo
                      que falta para completar 2 decimales (en gris) —
                      desaparece solo en cuanto el vendedor ya puso los suyos. */}
                  <div className="absolute inset-0 px-4 py-2.5 flex items-center pointer-events-none overflow-hidden text-sm" aria-hidden>
                    <span className="invisible whitespace-pre">{price}</span>
                    <span className="text-slate-400 dark:text-slate-500 whitespace-pre">{priceGhostSuffix(price)}</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setPrice(e.target.value); }}
                    placeholder="0.00"
                    className="relative w-full px-4 py-2.5 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="label">Cantidad en inventario</label>
                <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className="input no-spinner" placeholder="Sin control de inventario" />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Déjala vacía si no quieres llevar el conteo; se descuenta solo con cada venta.</p>
              </div>
              <div>
                <label className="label">Monto de anticipo para apartado</label>
                <input type="number" min="0" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="input no-spinner" placeholder="Sin apartado habilitado" />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Déjalo vacío si este producto no admite apartado. El cliente paga este monto por adelantado y el resto al recoger o recibir.</p>
              </div>
              <div>
                <label className="label">Categorías del producto</label>
                <CategoryPicker
                  mode="multi"
                  tree={categoryTree}
                  value={picks}
                  onChange={setPicks}
                  onCategoryCreated={addCreated}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Elige una o varias; busca una existente o crea una nueva con &quot;+ Nueva&quot;. Así aparece en cada categoría aunque no sea el giro principal de tu tienda.</p>
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
                Necesitas al menos 1 foto, precio y categoría para que el producto se muestre a tus clientes. Si falta algo, se guarda como <strong>borrador</strong> y solo tú lo ves aquí, hasta que lo completes.
              </p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                  ) : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product grid */}
      {!loaded ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-28 sm:h-40 bg-slate-100 dark:bg-white/5" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-14 text-center">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">Sin productos todavía</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">Agrega tus primeros productos para que los clientes los vean</p>
          <button onClick={openNew} className="btn-primary text-sm mx-auto flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> Agregar el primero
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-14 text-center">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">Sin resultados</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            {searchTerm ? <>Ningún producto coincide con &quot;{search}&quot;</> : "No hay productos en este filtro"}
          </p>
        </div>
      ) : (
        <>
        {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {pageProducts.map((p) => (
            <div key={p.id} className={`card overflow-hidden group hover:shadow-md transition-all ${p.is_available === false || p.is_draft ? "opacity-60" : ""}`}>
              <div className="h-28 sm:h-40 bg-slate-50 dark:bg-white/5 relative flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.name} fill className="object-contain group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}
                {p.is_draft ? (
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">Borrador</span>
                ) : p.is_available === false ? (
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-slate-600 text-white px-2 py-0.5 rounded-full">Pausado</span>
                ) : (
                  <StockBadge stock={p.stock_quantity} />
                )}
                {p.image_urls && p.image_urls.length > 1 && (
                  <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">
                    +{p.image_urls.length - 1} fotos
                  </span>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1">{p.name}</p>
                {p.description && (
                  <p className="hidden sm:line-clamp-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</p>
                )}
                <p className="text-brand-600 dark:text-brand-400 font-bold text-base sm:text-lg mt-1 sm:mt-2">{formatPrice(p.price)}</p>

                {/* Action buttons — prominentes */}
                <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  <button
                    onClick={() => handleToggleAvailability(p)}
                    title={p.is_available === false ? "Activar producto" : "Pausar producto"}
                    className={`w-9 sm:w-10 flex-shrink-0 flex items-center justify-center py-2 sm:py-2.5 rounded-xl border transition-colors ${
                      p.is_available === false
                        ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {p.is_available === false ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    title="Editar producto"
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors overflow-hidden"
                  >
                    <Pencil className="w-3.5 h-3.5 flex-shrink-0" /> <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    title="Eliminar producto"
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 transition-colors overflow-hidden"
                  >
                    <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /> <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
        <>
        {selectedIds.size > 0 && (
          <div className="card p-3 mb-3 flex items-center gap-3 flex-wrap bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button
                onClick={() => bulkSetAvailability(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Pausar
              </button>
              <button
                onClick={() => bulkSetAvailability(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Activar
              </button>
              <button
                onClick={bulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        <div className="card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={pageProducts.length > 0 && pageProducts.every((p) => selectedIds.has(p.id))}
                    onChange={() => toggleSelectAllOnPage(pageProducts.map((p) => p.id))}
                    className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-14"></th>
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Precio</th>
                <th className="px-3 py-2.5 text-right">Cantidad</th>
                <th className="px-3 py-2.5">Categorías</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {pageProducts.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${p.is_available === false || p.is_draft ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-white/5 relative overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-contain" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white max-w-[240px] truncate">{p.name}</td>
                  <td className="px-3 py-2 text-right text-brand-600 dark:text-brand-400 font-semibold whitespace-nowrap">{formatPrice(p.price)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap"><StockCell stock={p.stock_quantity} /></td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{p.categories?.length ? p.categories.join(", ") : "—"}</td>
                  <td className="px-3 py-2"><StatusBadge p={p} /></td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        title={p.is_available === false ? "Activar producto" : "Pausar producto"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          p.is_available === false
                            ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {p.is_available === false ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        title="Editar producto"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        title="Eliminar producto"
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">Página {currentPage} de {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
