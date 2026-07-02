import { logoutAction } from "../actions";
import { requireSession } from "@/lib/require-session";
import { getSessionContext } from "@/lib/session";
import { WebShell } from "@/components/web-shell";

// Authenticated area: DS shell (sidebar + header) around every screen.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  const ctx = await getSessionContext();

  return (
    <WebShell
      user={
        ctx
          ? { name: ctx.tenantName, detail: roleLabel(ctx.role) }
          : { name: "Sessão ativa" }
      }
      logoutAction={logoutAction}
    >
      {children}
    </WebShell>
  );
}

// PT label only in the UI; the wire value stays EN.
function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    manager: "Gestor da frota",
    admin: "Administrador",
    driver: "Motorista",
    mechanic: "Mecânico",
  };
  return labels[role] ?? role;
}
