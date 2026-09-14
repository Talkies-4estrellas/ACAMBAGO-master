"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Address } from "@/types";
import toast from "react-hot-toast";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

const EMPTY_FORM = { label: "Casa", street: "", notes: "", colonia: "", zip: "", city: "Acámbaro, Gto.", phone: "" };

export default function DireccionesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async (userId: string) => {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data ?? []) as Address[]);
    setLoading(false);
  };

  useEffect(() => {
    if (IS_DEMO) { queueMicrotask(() => setLoading(false)); return; }
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }
    load(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      label: addr.label,
      street: addr.street,
      notes: addr.notes ?? "",
      colonia: addr.colonia ?? "",
      zip: addr.zip ?? "",
      city: addr.city,
      phone: addr.phone,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = { ...form, user_id: user.id };
    const { error } = editing
      ? await supabase.from("addresses").update(payload).eq("id", editing.id)
      : await supabase.from("addresses").insert({ ...payload, is_default: addresses.length === 0 });

    if (error) {
      toast.error("No se pudo guardar la dirección");
    } else {
      toast.success(editing ? "Dirección actualizada" : "Dirección agregada");
      setShowForm(false);
      load(user.id);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("¿Eliminar esta dirección?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    toast.success("Dirección eliminada");
    load(user.id);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    load(user.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" /> Mis direcciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Guárdalas para no volver a escribirlas en cada compra</p>
        </div>
        {!IS_DEMO && (
          <button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>

      {IS_DEMO ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">
          Conecta Supabase para guardar direcciones reales.
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-slate-400 dark:text-slate-500">Cargando...</div>
      ) : addresses.length === 0 ? (
        <div className="card p-10 text-center">
          <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">Todavía no tienes direcciones guardadas.</p>
          <button onClick={openNew} className="btn-primary text-sm mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar la primera
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{addr.label}</p>
                    {addr.is_default && (
                      <span className="badge bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-[11px]">
                        <Star className="w-3 h-3 mr-1 fill-current" /> Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {addr.street}{addr.colonia ? `, ${addr.colonia}` : ""}{addr.zip ? `, CP ${addr.zip}` : ""}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{addr.city}</p>
                  {addr.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{addr.notes}</p>}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tel: {addr.phone}</p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(addr)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors" aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors" aria-label="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {!addr.is_default && (
                <button onClick={() => handleSetDefault(addr.id)} className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  Usar como predeterminada
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                {editing ? "Editar dirección" : "Nueva dirección"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-600 dark:text-gray-300" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Nombre de la dirección</label>
                <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input" placeholder="Casa, Trabajo..." />
              </div>
              <div>
                <label className="label">Calle y número</label>
                <input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="input" placeholder="Av. Juárez 123" />
              </div>
              <div>
                <label className="label">Referencias</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Casa azul, frente a la escuela" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Colonia</label>
                  <input value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })} className="input" placeholder="Centro" />
                </div>
                <div>
                  <label className="label">Código postal</label>
                  <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="input" placeholder="38400" />
                </div>
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Teléfono de contacto</label>
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="418 123 4567" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
