import { headers } from "next/headers";
import { RiErrorWarningLine, RiTruckLine } from "@remixicon/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@frotas/ui/components/alert";
import { Badge } from "@frotas/ui/components/badge";
import {
  getAppBaseDomain,
  getDevIdpSub,
  getDevTenantSlug,
} from "@/lib/config";
import { tenantSlugFromHost } from "@/lib/tenant-host";
import { LoginFlow } from "./login-flow";

// Login em etapas espelhando produção (identidade -> 2FA). A prefeitura vem do
// SUBDOMÍNIO (<slug>.<domínio> — F02), não de escolha do usuário. Em dev o
// código é fixo (000000) e localhost cai no slug de dev (prefdemo).
export default async function LoginPage() {
  const host = (await headers()).get("host") ?? "";
  const slug =
    tenantSlugFromHost(host, getAppBaseDomain()) ?? getDevTenantSlug();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <RiTruckLine className="size-6" />
        </span>
        <span className="grid leading-tight">
          <span className="font-heading text-xl font-semibold">
            Frota
          </span>
          <span className="text-xs text-muted-foreground">
            Gestão inteligente da frota pública
          </span>
        </span>
      </div>

      {slug ? (
        <>
          <Badge variant="secondary" className="font-mono">
            {slug}
          </Badge>
          <LoginFlow defaultSub={getDevIdpSub()} />
        </>
      ) : (
        <Alert variant="destructive" className="max-w-md">
          <RiErrorWarningLine />
          <AlertTitle>Endereço sem prefeitura</AlertTitle>
          <AlertDescription>
            Acesse pelo endereço da sua prefeitura (ex.:
            suaprefeitura.dominio.com.br).
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Acesso restrito · Frota
      </p>
    </main>
  );
}
