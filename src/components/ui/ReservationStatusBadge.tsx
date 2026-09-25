import { Clock, Store, Truck, Check, X, type LucideIcon } from "lucide-react";
import { ReservationStatus } from "@/types";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  textCls: string;
  bgCls: string;
  borderCls: string;
}

export const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, StatusConfig> = {
  reservado: { label: "Reservado", icon: Clock, textCls: "text-yellow-700 dark:text-yellow-400", bgCls: "bg-yellow-50 dark:bg-yellow-500/10", borderCls: "border-yellow-200 dark:border-yellow-500/20" },
  listo_en_sucursal: { label: "Listo en sucursal", icon: Store, textCls: "text-blue-700 dark:text-blue-400", bgCls: "bg-blue-50 dark:bg-blue-500/10", borderCls: "border-blue-200 dark:border-blue-500/20" },
  enviado_a_domicilio: { label: "Enviado a domicilio", icon: Truck, textCls: "text-blue-700 dark:text-blue-400", bgCls: "bg-blue-50 dark:bg-blue-500/10", borderCls: "border-blue-200 dark:border-blue-500/20" },
  entregado: { label: "Entregado", icon: Check, textCls: "text-green-700 dark:text-green-400", bgCls: "bg-green-50 dark:bg-green-500/10", borderCls: "border-green-200 dark:border-green-500/20" },
  cancelado: { label: "Cancelado", icon: X, textCls: "text-red-600 dark:text-red-400", bgCls: "bg-red-50 dark:bg-red-500/10", borderCls: "border-red-200 dark:border-red-500/20" },
};

export function ReservationStatusIcon({ status, className = "w-9 h-9 rounded-xl" }: { status: ReservationStatus; className?: string }) {
  const cfg = RESERVATION_STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  return (
    <div className={`${className} ${cfg.bgCls} border ${cfg.borderCls} flex items-center justify-center flex-shrink-0`}>
      <StatusIcon className={`w-4 h-4 ${cfg.textCls}`} />
    </div>
  );
}

export function ReservationStatusBadge({ status, className = "" }: { status: ReservationStatus; className?: string }) {
  const cfg = RESERVATION_STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bgCls} ${cfg.textCls} border ${cfg.borderCls} ${className}`}>
      <StatusIcon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}
