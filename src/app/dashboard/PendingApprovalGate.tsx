"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Clock, Settings } from "lucide-react";

export default function PendingApprovalGate({
  pendingApproval,
  children,
}: {
  pendingApproval: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pendingApproval && pathname !== "/dashboard/business/settings") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Tu negocio está pendiente de aprobación
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Un administrador está revisando la información de tu negocio. En cuanto lo aprueben, tendrás acceso completo a tu panel de vendedor.
        </p>
        <Link href="/dashboard/business/settings" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4" /> Revisar datos de mi negocio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
