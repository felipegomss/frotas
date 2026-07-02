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
import { DEV_PASSWORD } from "@/lib/dev-credentials";
import { DEV_OTP_LENGTH } from "@/lib/otp";
import { loginWithOtpAction, verifyCredentialsAction } from "./actions";

type Step = "credentials" | "otp";

/**
 * Fluxo de login em etapas, espelhando produção (ADR 0010): e-mail + senha ->
 * código de verificação (2FA). A prefeitura NÃO é escolhida aqui — vem do
 * subdomínio (F02). Em dev as credenciais e o código são fixos até o Cognito.
 */
export function LoginFlow({
  defaultEmail,
  tenantSlug,
}: {
  defaultEmail: string;
  tenantSlug: string;
}) {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitCredentials(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyCredentialsAction(email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOtp("");
      setStep("otp");
    });
  }

  function verifyCode(code: string) {
    setError(null);
    startTransition(async () => {
      // On success the action starts the session and redirects; only an error
      // object ever comes back here.
      const result = await loginWithOtpAction(code);
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
          {step === "credentials" ? "Entrar" : "Código de verificação"}
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          {step === "credentials" ? (
            "Acesse com seu e-mail e senha institucionais."
          ) : (
            <>
              Digite o código de {DEV_OTP_LENGTH} dígitos enviado para{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          )}
        </p>
        <Badge variant="secondary" className="font-mono">
          {tenantSlug}
        </Badge>
      </div>

      {step === "credentials" ? (
        <form onSubmit={submitCredentials}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@prefeitura.gov.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Verificando…" : "Continuar"}
              </Button>
            </Field>
            {error && (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FieldDescription className="text-center">
              Ambiente de desenvolvimento: senha{" "}
              <span className="font-mono font-medium">{DEV_PASSWORD}</span>.
            </FieldDescription>
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
                  setStep("credentials");
                  setError(null);
                }}
              >
                <RiArrowLeftLine />
                Voltar
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
