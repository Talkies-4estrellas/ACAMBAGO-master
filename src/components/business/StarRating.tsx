"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(!readonly && "cursor-pointer hover:scale-110 transition-transform")}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
