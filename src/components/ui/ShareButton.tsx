"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  businessName: string;
  url?: string;
  className?: string;
  label?: string;
}

export default function ShareButton({ businessName, url: urlProp, className, label = "Compartir" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = urlProp ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, text: `Mira ${businessName} en Acom-Di`, url });
      } catch {
        // El usuario canceló el share nativo, no hacemos nada.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className ?? "btn-secondary flex items-center gap-2 text-sm"}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {label}
    </button>
  );
}
