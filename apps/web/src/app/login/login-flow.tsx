"use client";

import { useState, useTransition } from "react";
import type { PrefecturesResponse } from "@frotas/contracts";
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiErrorWarningLine,
  RiGovernmentLine,
} from "@remixicon/react";
import { Alert, AlertDescription } from "@frotas/ui/components/alert";
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
import { Field, FieldDescription, FieldLabel } from "@frotas/ui/components/field";
import { Input } from "@frotas/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@frotas/ui/components/input-otp";
import { DEV_OTP_LENGTH } from "@/lib/otp";
import { loginAction, verifyOtpAction } from "./actions";

type Step = "identify" | "otp" | "tenant";

/**
 * Fluxo de login em etapas, espelhando o fluxo de produção (ADR 0010):
 * identidade -> código de verificação (2FA) -> escolha da prefeitura.
 * Em dev o código é fixo (000000) até o Cognito entrar.
 */
export function LoginFlow({ defaultSub }: { defaultSub: string }) {
  const [step, setStep] = useState<Step>("identify");
  const [sub, setSub] = useState(defaultSub);
  const [otp, setOtp] = useState("");
  const [prefectures, setPrefectures] = useState<PrefecturesResponse>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function goToOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setOtp("");
    setStep("otp");
  }

  function verifyCode(code: string) {
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(sub, code);
      if (!result.ok) {
        setError(result.message);
        setOtp("");
        return;
      }
      setPrefectures(result.prefectures);
      setStep("tenant");
    });
  }

  function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length === DEV_OTP_LENGTH) verifyCode(otp);
  }

  return (
    <Card className="w-full max-w-md">
      {step === "identify" && (
        <>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Informe sua identidade para receber o código de verificação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={goToOtp} className="grid gap-6">
              <Field>
                <FieldLabel htmlFor="sub">Identidade (sub)</FieldLabel>
                <Input
                  id="sub"
                  name="sub"
                  value={sub}
                  onChange={(event) => setSub(event.target.value)}
                  required
                />
                <FieldDescription>
                  Login de desenvolvimento — em produção será seu e-mail
                  institucional.
                </FieldDescription>
              </Field>
              <Button type="submit" className="w-full">
                Enviar código
              </Button>
            </form>
          </CardContent>
        </>
      )}

      {step === "otp" && (
        <>
          <CardHeader>
            <CardTitle>Código de verificação</CardTitle>
            <CardDescription>
              Digite o código de {DEV_OTP_LENGTH} dígitos enviado para{" "}
              <span className="font-medium text-foreground">{sub}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitOtp} className="grid gap-6">
              <div className="flex justify-center">
                <InputOTP
                  autoFocus
                  maxLength={DEV_OTP_LENGTH}
                  value={otp}
                  onChange={setOtp}
                  onComplete={verifyCode}
                  disabled={pending}
                  aria-label="Código de verificação"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <Alert variant="destructive">
                  <RiErrorWarningLine />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending || otp.length < DEV_OTP_LENGTH}
                >
                  {pending ? "Verificando…" : "Verificar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  disabled={pending}
                  onClick={() => {
                    setStep("identify");
                    setError(null);
                  }}
                >
                  <RiArrowLeftLine />
                  Usar outra identidade
                </Button>
              </div>

              <p className="text-center text-muted-foreground text-xs">
                Ambiente de desenvolvimento: use{" "}
                <span className="font-mono font-medium">000000</span>.
              </p>
            </form>
          </CardContent>
        </>
      )}

      {step === "tenant" && (
        <>
          <CardHeader>
            <CardTitle>Escolha a prefeitura</CardTitle>
            <CardDescription>
              Selecione a prefeitura em que deseja atuar nesta sessão.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {prefectures.length === 0 ? (
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
            ) : (
              <ul className="grid gap-2">
                {prefectures.map((p) => (
                  <li key={p.id}>
                    <form action={loginAction}>
                      <input type="hidden" name="tenantId" value={p.id} />
                      <input type="hidden" name="sub" value={sub} />
                      <input type="hidden" name="otp" value={otp} />
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
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setStep("identify");
                setOtp("");
                setError(null);
              }}
            >
              <RiArrowLeftLine />
              Trocar de identidade
            </Button>
          </CardContent>
        </>
      )}
    </Card>
  );
}
