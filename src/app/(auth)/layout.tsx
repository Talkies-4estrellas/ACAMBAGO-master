import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <div className="h-12 bg-white rounded-2xl px-3 flex items-center">
              <Image src="/acomdi.png" alt="Acom-Di" width={100} height={40} className="h-10 w-auto object-contain" />
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
