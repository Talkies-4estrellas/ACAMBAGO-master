"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/types";
import { Plus, Pencil, Trash2, Package, Upload, X, AlertCircle, PauseCircle, PlayCircle } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import { loadOwnedBusinesses } from "@/lib/current-business";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";
const MAX_IMAGES = 6;

interface ImageSlot {
  url?: string;   // ya subida a Storage
  file?: File;    // pendiente de subir
  preview: string;
}

function StockBadge({ stock }: { stock?: number }) {
  if (stock == null) return null;
  if (stock === 0) {
    return <span className="absolute top-2 left-2 text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full">Agotado</span>;
  }
  if (stock <= 5) {
    return <span className="absolute top-2 left-2 text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">Últimas {stock}</span>;
  }
  return <span className="absolute top-2 left-2 text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">{stock} en stock</span>;
}

export default function ProductsPage() {
  const { user, isLoaded } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"todos" | "agotados">("todos");

  const supabase = createClient();

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
      const { data } = await supabase.from("products").select("*").eq("business_id", biz.id).order("created_at", { ascending: false });
      setProducts((data ?? []) as Product[]);
      setLoaded(true);
    };
    load();
  }, [isLoaded, user?.id]);

  const openNew = () => {
    if (IS_DEMO) { toast("Conecta Supabase para agregar productos reales", { icon: "ℹ️" }); return; }
    setEditing(null); setName(""); setDescription(""); setPrice(""); setStock("");
    setImages([]); setShowForm(true);
  };

  const openEdit = (p: Product) => {
    if (IS_DEMO) { toast("Conecta Supabase para editar productos", { icon: "ℹ️" }); return; }
    setEditing(p); setName(p.name); setDescription(p.description ?? "");
    setPrice(String(p.price));
    setStock(p.stock_quantity != null ? String(p.stock_quantity) : "");
    const existing = p.image_urls?.length ? p.image_urls : p.image_url ? [p.image_url] : [];
    setImages(existing.map((url) => ({ url, preview: url })));
    setShowForm(true);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error("No se encontró tu negocio. Recarga la página.");
      return;
    }
    setSaving(true);

    const finalUrls: string[] = [];
    for (const img of images) {
      if (img.url) {
        finalUrls.push(img.url);
        continue;
      }
      if (img.file) {
        const ext = img.file.name.split(".").pop();
        const path = `${businessId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, img.file, { upsert: true });
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

    if (editing) {
      const { error } = await supabase.from("products").update({ name, description, price: parseFloat(price), image_url, image_urls, stock_quantity }).eq("id", editing.id);
      if (error) {
        toast.error(`Error al actualizar: ${error.message}`);
      } else {
        setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, name, description, price: parseFloat(price), image_url, image_urls, stock_quantity: stock_quantity ?? undefined } : p));
        toast.success("Producto actualizado");
        setShowForm(false);
      }
    } else {
      const { data, error } = await supabase.from("products").insert({ business_id: businessId, name, description, price: parseFloat(price), image_url, image_urls, stock_quantity }).select().single();
      if (error) {
        toast.error(`Error al guardar: ${error.message}`);
      } else if (data) {
        setProducts((prev) => [data as Product, ...prev]);
        toast.success("Producto agregado");
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

  const handleDelete = async (id: string) => {
    if (IS_DEMO) { toast("Conecta Supabase para eliminar productos", { icon: "ℹ️" }); return; }
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Producto eliminado");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Productos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{products.length} productos publicados</p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary flex items-center gap-2 text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      {/* Tabs */}
      {products.some((p) => p.stock_quantity === 0) && (
        <div className="flex gap-2 mb-4">
          {[
            { id: "todos" as const, label: "Todos" },
            { id: "agotados" as const, label: "Agotados" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
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
      )}

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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
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
                    <div key={i} className="relative h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                      <Image src={img.preview} alt={`Foto ${i + 1}`} fill className="object-cover" />
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
                      className="h-24 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/20 hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer text-slate-400 dark:text-slate-500 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <p className="text-[10px] font-medium">Agregar foto</p>
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
                <label className="label">Precio (MXN) *</label>
                <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Cantidad en inventario</label>
                <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className="input" placeholder="Sin control de inventario" />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Déjalo vacío si no quieres llevar el conteo; se descuenta solo con cada venta.</p>
              </div>

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {products.filter((p) => tab === "todos" || p.stock_quantity === 0).map((p) => (
            <div key={p.id} className={`card overflow-hidden group hover:shadow-md transition-all ${p.is_available === false ? "opacity-60" : ""}`}>
              <div className="h-28 sm:h-40 bg-slate-50 dark:bg-white/5 relative flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}
                {p.is_available === false ? (
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
                  <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>
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
                    onClick={() => handleDelete(p.id)}
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
      )}
    </div>
  );
}
