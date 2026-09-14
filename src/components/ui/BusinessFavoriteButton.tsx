"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

export default function BusinessFavoriteButton({ businessId }: { businessId: string }) {
  const { user, isLoaded } = useUser();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const supabase = createClient();
    supabase
      .from("business_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .maybeSingle()
      .then(({ data }) => setFavorited(!!data));
  }, [isLoaded, user, businessId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoaded) return;
    if (!user) {
      toast.error("Inicia sesión para guardar tus tiendas favoritas");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (favorited) {
      const { error } = await supabase
        .from("business_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", businessId);
      if (!error) setFavorited(false);
    } else {
      const { error } = await supabase
        .from("business_favorites")
        .insert({ user_id: user.id, business_id: businessId });
      if (!error) { setFavorited(true); toast.success("Agregada a tus tiendas favoritas"); }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? "Quitar tienda de favoritos" : "Agregar tienda a favoritos"}
      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center transition-colors"
    >
      <Heart className={`w-4 h-4 transition-colors ${favorited ? "fill-red-500 text-red-500" : "text-white"}`} />
    </button>
  );
}
