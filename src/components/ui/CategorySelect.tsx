"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CategorySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-slate-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg py-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                option === value
                  ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium"
                  : "text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
