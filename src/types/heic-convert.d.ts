declare module "heic-convert/browser" {
  interface HeicConvertOptions {
    buffer: ArrayBuffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }
  function convert(options: HeicConvertOptions): Promise<Uint8Array>;
  export default convert;
}
