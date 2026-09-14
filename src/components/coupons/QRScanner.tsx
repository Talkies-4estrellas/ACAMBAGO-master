"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-scanner-element";

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().then(() => onScan(decodedText));
        },
        () => {}
      )
      .then(() => setStarted(true))
      .catch((err) => {
        setError("No se pudo acceder a la cámara. Permite el permiso de cámara.");
        console.error(err);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-600" />
            <span className="font-semibold text-gray-900">Escanear cupón QR</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
              <button onClick={onClose} className="btn-secondary mt-4 text-sm">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div id={elementId} className="rounded-xl overflow-hidden" />
              {!started && (
                <p className="text-center text-sm text-gray-500 mt-3 animate-pulse">
                  Iniciando cámara...
                </p>
              )}
              {started && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Apunta al código QR del cupón
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
