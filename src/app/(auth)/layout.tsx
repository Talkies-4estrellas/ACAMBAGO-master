import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <div className="h-12 flex items-center">
              <BrandLogo height={40} />
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
