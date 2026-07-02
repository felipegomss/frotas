import type { PrefecturesResponse } from "@frotas/contracts";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">AMPARO Frota</h1>
        <p className="text-sm text-zinc-500">Login de desenvolvimento</p>
      </div>

      <form method="get" className="flex items-end gap-2">
        <label className="flex-1 text-sm font-medium text-zinc-700">
          Identidade (sub)
          <input
            name="sub"
            defaultValue={sub}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
        >
          Carregar
        </button>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!error && prefectures.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhuma prefeitura vinculada a esta identidade.
        </p>
      )}

      <ul className="space-y-2">
        {prefectures.map((p) => (
          <li key={p.id}>
            <form action={loginAction}>
              <input type="hidden" name="tenantId" value={p.id} />
              <input type="hidden" name="sub" value={sub} />
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-4 py-3 text-left text-sm hover:bg-zinc-50"
              >
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-zinc-500">{p.role}</span>
                </span>
                <span aria-hidden>→</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
