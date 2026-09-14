import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/perfil(.*)",
]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

export const proxy = clerkMiddleware(async (auth, req) => {
  // La cookie demo_mode solo debe saltarse la auth real cuando no hay Supabase
  // configurado (modo demo). Con credenciales reales, nadie debe poder usar esta
  // cookie para esquivar el login de Clerk en producción.
  const demoCookie = IS_DEMO ? req.cookies.get("demo_mode")?.value : undefined;
  if (demoCookie === "buyer" || demoCookie === "seller") {
    // Block demo buyers from seller dashboard
    if (demoCookie === "buyer" && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/perfil", req.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
