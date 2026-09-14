"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Upload, X, Check, ZoomIn, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15MB — evita ahogar el navegador con fotos de celular gigantes

interface Props {
  label: string;
  helperText?: string;
  /** ancho/alto del marco de recorte, ej. 1 para cuadrado, 3 para banner panorámico. */
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  shape?: "round" | "rect";
  /** URL ya guardada (modo edición). Se muestra como preview hasta que se elija una nueva. */
  currentUrl?: string | null;
  /** Se llama con el blob ya recortado y convertido a webp/png, o null si el usuario no cambió nada. */
  onChange: (blob: Blob | null) => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToBlob(imageSrc: string, area: Area, outputWidth: number, outputHeight: number): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el recorte");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outputWidth, outputHeight);

  return new Promise((resolve, reject) => {
    // Si el navegador no sabe codificar webp, cae solo a png (comportamiento
    // nativo del propio toBlob) — nunca se sube algo mal etiquetado porque
    // la extension final se decide leyendo blob.type, no asumiendolo.
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
      "image/webp",
      0.85
    );
  });
}

export default function ImageCropUpload({
  label,
  helperText,
  aspect,
  outputWidth,
  outputHeight,
  shape = "rect",
  currentUrl,
  onChange,
}: Props) {
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  const croppedAreaRef = useRef<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Ese archivo no es una imagen.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("La imagen pesa demasiado (máximo 15MB). Prueba con otra.");
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPickedSrc(URL.createObjectURL(file));
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const closeModal = () => {
    if (pickedSrc) URL.revokeObjectURL(pickedSrc);
    setPickedSrc(null);
  };

  const handleConfirm = async () => {
    if (!pickedSrc || !croppedAreaRef.current) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(pickedSrc, croppedAreaRef.current, outputWidth, outputHeight);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      onChange(blob);
      closeModal();
    } catch {
      toast.error("No se pudo recortar la imagen. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    croppedAreaRef.current = areaPixels;
  }, []);

  const shownUrl = previewUrl ?? currentUrl ?? null;
  const previewShapeClass = shape === "round" ? "rounded-full w-20 h-20" : "rounded-xl w-full max-w-[240px] aspect-[3/1]";
  const sizeLabel = `${outputWidth}×${outputHeight}px (${shape === "round" ? "cuadrada" : "panorámica"})`;

  return (
    <div>
      <label className="label">{label}</label>
      {helperText && <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{helperText}</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
        Tamaño final: <strong>{sizeLabel}</strong>. Encuadra lo importante dentro del marco para que no se corte.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-colors ${
          draggingOver ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-white/10"
        }`}
      >
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shownUrl} alt="" className={`${previewShapeClass} object-cover border border-slate-200 dark:border-white/10 flex-shrink-0`} />
        ) : (
          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <label className="flex items-center gap-2 cursor-pointer btn-secondary text-sm w-fit">
            <Upload className="w-4 h-4" />
            {shownUrl ? "Cambiar imagen" : "Subir imagen"}
            <input ref={inputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">o arrastra una imagen aquí</p>
        </div>
      </div>

      {pickedSrc && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a1628] rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="relative w-full h-80 bg-slate-900">
              <Cropper
                image={pickedSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={shape === "round" ? "round" : "rect"}
                showGrid={shape !== "round"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Arrastra la imagen y usa el zoom para encuadrarla. Se guardará a {sizeLabel}.
              </p>
              <div className="flex items-center gap-3">
                <ZoomIn className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button type="button" onClick={handleConfirm} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Check className="w-4 h-4" /> {saving ? "Guardando..." : "Usar esta imagen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
