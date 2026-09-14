import Link from "next/link";
import { Lock, ArrowLeft, Wallet, CreditCard, Building2, Banknote, ShieldCheck } from "lucide-react";

const METHODS = [
  {
    icon: Wallet,
    title: "Mercado Pago",
    desc: "Tarjeta de crédito/débito, OXXO o SPEI, desde el checkout de Mercado Pago.",
  },
  {
    icon: CreditCard,
    title: "Tarjeta con Stripe",
    desc: "Pago con tarjeta procesado por Stripe, uno de los procesadores más usados a nivel mundial.",
  },
  {
    icon: Building2,
    title: "Transferencia bancaria",
    desc: "Se te muestran los datos bancarios reales de la tienda para transferir directo.",
  },
  {
    icon: Banknote,
    title: "Efectivo",
    desc: "Pagas en efectivo al recoger tu pedido o al recibirlo a domicilio.",
  },
];

export default function PagoSeguroPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center">
          <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pago seguro</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Cómo funciona el pago en Acom-Di</p>
        </div>
      </div>

      <div className="card p-5 flex gap-3 mb-6 border-l-4 border-l-brand-500">
        <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600 dark:text-gray-300">
          Cada tienda cobra con su propia cuenta de Mercado Pago, Stripe o banco. El dinero de tu compra
          llega directo al vendedor; Acom-Di solo conecta el pago, nunca lo retiene.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METHODS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-5 flex gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-slate-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
        Los métodos disponibles varían según lo que cada tienda tenga activado; el checkout solo te
        muestra las opciones que aceptan los negocios de tu carrito.
      </p>
    </div>
  );
}
