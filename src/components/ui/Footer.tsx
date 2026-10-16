import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 mt-auto bg-white/80 dark:bg-[#040a12]/60">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <div className="h-9 flex items-center">
              <BrandLogo height={28} />
            </div>
          </Link>
          <p className="text-sm text-slate-500 dark:text-gray-500">
            Revista de Acámbaro, Guanajuato. © {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-sm text-slate-500 dark:text-gray-500">
            <Link href="/map" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Mapa</Link>
            <Link href="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Negocios</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
