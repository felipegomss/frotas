import { headers } from "next/headers";
import {
  RiBarChart2Line,
  RiCarLine,
  RiErrorWarningLine,
  RiGasStationLine,
  RiMapPin2Line,
  RiToolsLine,
  RiTruckLine,
} from "@remixicon/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@frotas/ui/components/alert";
import {
  getAppBaseDomain,
  getDevIdpSub,
  getDevTenantSlug,
} from "@/lib/config";
import { tenantSlugFromHost } from "@/lib/tenant-host";
import { LoginFlow } from "./login-flow";

// Layout de duas colunas (padrão shadcn login-02): formulário à esquerda,
// painel de marca à direita. Login em etapas espelhando produção (identidade ->
// 2FA); a prefeitura vem do SUBDOMÍNIO (<slug>.<domínio> — F02), não de escolha
// do usuário. Em dev o código é fixo (000000) e localhost cai no slug prefdemo.
const PANEL_FEATURES = [
  { key: "veiculos", Icon: RiCarLine },
  { key: "abastecimento", Icon: RiGasStationLine },
  { key: "manutencao", Icon: RiToolsLine },
  { key: "relatorios", Icon: RiBarChart2Line },
  { key: "rastreio", Icon: RiMapPin2Line },
];

export default async function LoginPage() {
  const host = (await headers()).get("host") ?? "";
  const slug =
    tenantSlugFromHost(host, getAppBaseDomain()) ?? getDevTenantSlug();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <RiTruckLine className="size-5" />
          </span>
          <span className="font-heading text-lg font-semibold">Frota</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {slug ? (
              <LoginFlow defaultSub={getDevIdpSub()} tenantSlug={slug} />
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

        <p className="text-center text-xs text-muted-foreground lg:text-left">
          Acesso restrito · Frota
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <RiTruckLine className="size-6" />
          <span className="font-heading text-lg font-semibold">Frota</span>
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold text-balance">
            Gestão inteligente da frota pública
          </h2>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            Veículos, motoristas, abastecimento e manutenção — tudo em um só
            lugar, para cada prefeitura.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {PANEL_FEATURES.map(({ key, Icon }) => (
              <span
                key={key}
                className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/10"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-foreground/60">DDS Sistemas</p>
      </div>
    </div>
  );
}
