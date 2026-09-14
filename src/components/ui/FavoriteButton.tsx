"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

export default function FavoriteButton({ productId }: { productId: string }) {
  const { user, isLoaded } = useUser();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const supabase = createClient();
    supabase
      .from("product_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => setFavorited(!!data));
  }, [isLoaded, user, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoaded) return;
    if (!user) {
      toast.error("Inicia sesión para guardar tus favoritos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (favorited) {
      const { error } = await supabase
        .from("product_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (!error) setFavorited(false);
    } else {
      const { error } = await supabase
        .from("product_favorites")
        .insert({ user_id: user.id, product_id: productId });
      if (!error) setFavorited(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center transition-colors"
    >
      <Heart className={`w-4 h-4 transition-colors ${favorited ? "fill-red-500 text-red-500" : "text-white"}`} />
    </button>
  );
}
