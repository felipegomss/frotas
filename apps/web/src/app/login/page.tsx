import { getAppBaseDomain, getDevTenantSlug } from "@/lib/config";
import { DEV_EMAIL } from "@/lib/dev-credentials";
import { tenantSlugFromHost } from "@/lib/tenant-host";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@frotas/ui/components/alert";
import { cn } from "@frotas/ui/lib/utils";
import { RiCarLine, RiErrorWarningLine } from "@remixicon/react";
import { Barlow } from "next/font/google";
import { headers } from "next/headers";
import { LoginFlow } from "./login-flow";

// Wordmark/headings usam Barlow (direção de marca do design importado). Escopo
// local ao login via --font-brand; não altera o --font-heading global.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-brand",
});

// Layout de duas colunas (design "Frota Digital"): formulário à esquerda, foto
// da frota à direita. Login e-mail + senha -> 2FA, espelhando o Cognito (ADR
// 0010); a prefeitura vem do SUBDOMÍNIO (F02), não de escolha do usuário.
export default async function LoginPage() {
  const host = (await headers()).get("host") ?? "";
  const slug =
    tenantSlugFromHost(host, getAppBaseDomain()) ?? getDevTenantSlug();

  return (
    <div className={cn(barlow.variable, "grid min-h-svh lg:grid-cols-2")}>
      <div className="flex flex-col gap-8 p-8 md:p-11">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
            <RiCarLine className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-brand)] text-[15px] font-bold tracking-[0.3px]">
            <span className="text-primary">FROTA</span>
            <br />
            <span className="text-success">DIGITAL</span>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {slug ? (
              <LoginFlow defaultEmail={DEV_EMAIL} />
            ) : (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertTitle>Endereço sem prefeitura</AlertTitle>
                <AlertDescription>
                  Acesse pelo endereço da sua prefeitura (ex.:
                  suaprefeitura.dominio.com.br).
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Frota Digital</span>
          <span>Gestão de frota pública</span>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        {/* Servida localmente por ora; migrar para CDN futuramente (ver
            public/images/CREDITS.txt). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/login-fleet.jpg"
          alt="Frota municipal estacionada em pátio"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/45 to-primary/90" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <h2 className="font-[family-name:var(--font-brand)] max-w-md text-[26px] font-bold leading-[1.25] tracking-[-0.3px]">
            Toda a frota do município, sob controle e transparência.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            Veículos, abastecimento, manutenção e ordens de uso em um só sistema
            — pronto para prestação de contas.
          </p>
        </div>
      </div>
    </div>
  );
}
