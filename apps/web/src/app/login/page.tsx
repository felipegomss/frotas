import { RiTruckLine } from "@remixicon/react";
import { getDevIdpSub } from "@/lib/config";
import { LoginFlow } from "./login-flow";

// Login em etapas espelhando produção (identidade -> 2FA -> prefeitura).
// Em dev o código é fixo (000000); Cognito substitui o IdP fake (ADR 0010).
export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <RiTruckLine className="size-6" />
        </span>
        <span className="grid leading-tight">
          <span className="font-heading text-xl font-semibold">
            AMPARO Frota
          </span>
          <span className="text-xs text-muted-foreground">
            Gestão inteligente da frota pública
          </span>
        </span>
      </div>

      <LoginFlow defaultSub={getDevIdpSub()} />

      <p className="text-xs text-muted-foreground">
        Acesso restrito · AMPARO Frota
      </p>
    </main>
  );
}
