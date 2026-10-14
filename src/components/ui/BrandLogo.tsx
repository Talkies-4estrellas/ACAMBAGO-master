import Image from "next/image";

// Dos versiones de cada logo: la normal (degradado verde petróleo, pensada
// para fondo claro) y una "dark" con los tonos oscuros del degradado
// levantados, porque sobre un fondo casi negro esos extremos se pierden. Se
// renderizan las dos y Tailwind muestra solo la que corresponde al tema
// (darkMode: "class"), así no hay parpadeo al cargar como pasaría si se
// decidiera con JavaScript.
const LOGOS = {
  full: { ratio: 318.48 / 77.1, light: "/logo-acomdi.svg", dark: "/logo-acomdi-dark.svg" },
  mark: { ratio: 61.52 / 61.03, light: "/logo-acomdi-mark.svg", dark: "/logo-acomdi-mark-dark.svg" },
} as const;

interface Props {
  variant?: keyof typeof LOGOS;
  /** Alto en píxeles; el ancho sale de la proporción real del SVG. */
  height: number;
  priority?: boolean;
}

export default function BrandLogo({ variant = "full", height, priority = false }: Props) {
  const { ratio, light, dark } = LOGOS[variant];
  const width = Math.round(height * ratio);
  const style = { height, width: "auto" } as const;

  return (
    <>
      <Image src={light} alt="Acom-Di" width={width} height={height} priority={priority} style={style} className="object-contain dark:hidden" />
      <Image src={dark} alt="Acom-Di" width={width} height={height} priority={priority} style={style} className="object-contain hidden dark:block" />
    </>
  );
}
