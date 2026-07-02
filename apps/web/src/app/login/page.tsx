import type { PrefecturesResponse } from "@frotas/contracts";
import {
  RiArrowRightSLine,
  RiErrorWarningLine,
  RiGovernmentLine,
  RiTruckLine,
} from "@remixicon/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@frotas/ui/components/alert";
import { Badge } from "@frotas/ui/components/badge";
import { Button } from "@frotas/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@frotas/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@frotas/ui/components/empty";
import { Input } from "@frotas/ui/components/input";
import { Label } from "@frotas/ui/components/label";
import { Separator } from "@frotas/ui/components/separator";
import { fetchDevIdpToken, listPrefectures } from "@/lib/auth-dev";
import { getDevIdpSub } from "@/lib/config";
import { loginAction } from "./actions";

// Dev login screen. Lists the prefectures the seeded identity may act in and
// lets the operator pick one. Replaced by a real Cognito flow post-MVP (ADR 0010).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string }>;
}) {
  const sub = (await searchParams).sub || getDevIdpSub();

  let prefectures: PrefecturesResponse = [];
  let error: string | null = null;
  try {
    const idpToken = await fetchDevIdpToken(sub);
    prefectures = await listPrefectures(idpToken);
  } catch {
    error =
      "Não foi possível carregar as prefeituras. Confira se a API e o IdP de " +
      "desenvolvimento estão no ar.";
  }

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

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Login de desenvolvimento — escolha a prefeitura em que deseja
            atuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form method="get" className="flex items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="sub">Identidade (sub)</Label>
              <Input id="sub" name="sub" defaultValue={sub} />
            </div>
            <Button type="submit" variant="outline">
              Carregar
            </Button>
          </form>

          <Separator />

          {error && (
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertTitle>Falha ao carregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && prefectures.length === 0 && (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiGovernmentLine />
                </EmptyMedia>
                <EmptyTitle>Nenhuma prefeitura</EmptyTitle>
                <EmptyDescription>
                  Esta identidade não está vinculada a nenhuma prefeitura.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {prefectures.length > 0 && (
            <ul className="grid gap-2">
              {prefectures.map((p) => (
                <li key={p.id}>
                  <form action={loginAction}>
                    <input type="hidden" name="tenantId" value={p.id} />
                    <input type="hidden" name="sub" value={sub} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-auto w-full justify-between px-4 py-3"
                    >
                      <span className="flex items-center gap-3">
                        <RiGovernmentLine className="text-muted-foreground" />
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="secondary">{p.role}</Badge>
                      </span>
                      <RiArrowRightSLine className="text-muted-foreground" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Acesso restrito · AMPARO Frota
      </p>
    </main>
  );
}
