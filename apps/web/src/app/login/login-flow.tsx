"use client";

import { useState, useTransition } from "react";
import {
  RiArrowLeftLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiEyeOffLine,
} from "@remixicon/react";
import { Alert, AlertDescription } from "@frotas/ui/components/alert";
import { Badge } from "@frotas/ui/components/badge";
import { Button } from "@frotas/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@frotas/ui/components/field";
import { Input } from "@frotas/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@frotas/ui/components/input-otp";
import { DEV_PASSWORD } from "@/lib/dev-credentials";
import { DEV_OTP_LENGTH } from "@/lib/otp";
import { loginWithOtpAction, verifyCredentialsAction } from "./actions";

type Step = "credentials" | "otp";

/** Mascara o local-part do e-mail para a tela de 2FA (ge•••@dominio). */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const head = local.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

/**
 * Fluxo de login (design "Frota Digital"): e-mail + senha -> código 2FA,
 * espelhando o Cognito (ADR 0010). A prefeitura vem do subdomínio (F02). Em dev
 * as credenciais e o código são fixos e validados no servidor.
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
  const [showPassword, setShowPassword] = useState(false);
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

  if (step === "otp") {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setError(null);
          }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <RiArrowLeftLine className="size-4" />
          Voltar
        </button>

        <div className="mb-7">
          <h1 className="font-[family-name:var(--font-brand)] text-[26px] font-bold leading-[1.15] text-foreground">
            Verificação em duas etapas
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Digite o código de {DEV_OTP_LENGTH} dígitos enviado para{" "}
            <span className="font-semibold text-foreground">
              {maskEmail(email)}
            </span>
            .
          </p>
        </div>

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
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:size-11 *:data-[slot=input-otp-slot]:text-base">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
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
                {pending ? "Entrando…" : "Verificar e entrar"}
              </Button>
            </Field>

            <p className="text-center text-sm text-muted-foreground">
              Não recebeu o código?{" "}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  // Reenvio real é do Cognito (prod); em dev o código é fixo.
                  setOtp("");
                  setError(null);
                }}
                className="font-semibold text-primary hover:underline disabled:opacity-50"
              >
                Reenviar
              </button>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              Ambiente de desenvolvimento: use{" "}
              <span className="font-mono font-medium">000000</span>.
            </p>
          </FieldGroup>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-brand)] text-[26px] font-bold leading-[1.15] text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Entre na retaguarda do sistema de gestão da frota.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 font-mono">
          {tenantSlug}
        </Badge>
      </div>

      <form onSubmit={submitCredentials}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail institucional</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nome.sobrenome@prefeitura.gov.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <button
                type="button"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Recuperação real é do Cognito (prod).
                }}
              >
                Esqueci minha senha
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                className="pr-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <RiEyeOffLine className="size-4" />
                ) : (
                  <RiEyeLine className="size-4" />
                )}
              </button>
            </div>
          </Field>

          {error && (
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Verificando…" : "Entrar"}
            </Button>
          </Field>

          <p className="text-center text-xs text-muted-foreground">
            Ambiente de desenvolvimento: senha{" "}
            <span className="font-mono font-medium">{DEV_PASSWORD}</span>.
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
