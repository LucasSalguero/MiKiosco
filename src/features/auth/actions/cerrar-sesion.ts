"use server";

import { cookies } from "next/headers";

import { COOKIE_SESION } from "@/shared/lib/autenticacion";
import { ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

export async function cerrarSesion(): Promise<Resultado<boolean>> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESION);
  return ok(true);
}
