import { NextResponse, type NextRequest } from "next/server";

const COOKIE_SESION = "mi-kiosco-session";
const SEGUNDOS_SESION = 12 * 60 * 60;

async function sesionValida(token: string | undefined): Promise<boolean> {
  const secreto = process.env.AUTH_SESSION_SECRET;
  if (!secreto || secreto.length < 32 || !token) return false;

  const [expiracion, firmaCodificada, extra] = token.split(".");
  if (
    extra !== undefined ||
    !/^\d{10,}$/.test(expiracion ?? "") ||
    !firmaCodificada ||
    Number(expiracion) <= Math.floor(Date.now() / 1000) ||
    Number(expiracion) > Math.floor(Date.now() / 1000) + SEGUNDOS_SESION
  ) {
    return false;
  }

  try {
    const firma = Uint8Array.from(
      atob(firmaCodificada.replace(/-/g, "+").replace(/_/g, "/")),
      (caracter) => caracter.charCodeAt(0),
    );
    const clave = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secreto),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify("HMAC", clave, firma, new TextEncoder().encode(expiracion));
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESION)?.value;
  if (await sesionValida(token)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", error: "Ingresá el PIN para continuar." },
      { status: 401 },
    );
  }

  const destino = request.nextUrl.clone();
  destino.pathname = "/login";
  destino.search = "";
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|login|manifest.webmanifest|sw.js|offline.html|icon-).*)"],
};
