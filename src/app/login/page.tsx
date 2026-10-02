import type { Metadata } from "next";

import { Desbloqueo } from "@/features/auth/ui/Desbloqueo";

export const metadata: Metadata = {
  title: "Desbloquear · Mi Kiosco",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <Desbloqueo />;
}
