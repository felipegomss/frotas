"use client";

import { useState, useTransition } from "react";
import { RiArrowLeftLine, RiErrorWarningLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@frotas/ui/components/alert";
import { Badge } from "@frotas/ui/components/badge";
import { Button } from "@frotas/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@frotas/ui/components/field";
import { Input } from "@frotas/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@frotas/ui/components/input-otp";
import { DEV_OTP_LENGTH } from "@/lib/otp";
import { loginWithOtpAction } from "./actions";

type Step = "identify" | "otp";

/**
 * Fluxo de login em etapas, espelhando produção (ADR 0010): identidade ->
 * código de verificação (2FA). A prefeitura NÃO é escolhida aqui — vem do
 * subdomínio (F02). Em dev o código é fixo (000000) até o Cognito entrar.
 */
export function LoginFlow({
  defaultSub,
  tenantSlug,
}: {
  defaultSub: string;
  tenantSlug: string;
}) {
  const [step, setStep] = useState<Step>("identify");
  const [sub, setSub] = useState(defaultSub);
  const [otp, setOtp] = useState("");
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
      // On success the action starts the session and redirects; only an error
      // object ever comes back here.
      const result = await loginWithOtpAction(sub, code);
      if (result && !result.ok) {
        setError(result.message);
        setOtp("");
      }
    });
  }

  function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length === DEV_OTP_LENGTH) verifyCode(otp);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          {step === "identify" ? "Entrar" : "Código de verificação"}
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          {step === "identify" ? (
            "Informe sua identidade para receber o código de verificação."
          ) : (
            <>
              Digite o código de {DEV_OTP_LENGTH} dígitos enviado para{" "}
              <span className="font-medium text-foreground">{sub}</span>.
            </>
          )}
        </p>
        <Badge variant="secondary" className="font-mono">
          {tenantSlug}
        </Badge>
      </div>

      {step === "identify" ? (
        <form onSubmit={goToOtp}>
          <FieldGroup>
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
            <Field>
              <Button type="submit">Enviar código</Button>
            </Field>
          </FieldGroup>
        </form>
      ) : (
        <form onSubmit={submitOtp}>
          <FieldGroup>
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

            <Field>
              <Button
                type="submit"
                disabled={pending || otp.length < DEV_OTP_LENGTH}
              >
                {pending ? "Entrando…" : "Entrar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                disabled={pending}
                onClick={() => {
                  setStep("identify");
                  setError(null);
                }}
              >
                <RiArrowLeftLine />
                Usar outra identidade
              </Button>
            </Field>

            <FieldDescription className="text-center">
              Ambiente de desenvolvimento: use{" "}
              <span className="font-mono font-medium">000000</span>.
            </FieldDescription>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
