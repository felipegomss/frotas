import Link from "next/link";
import { logoutAction } from "../actions";

// Minimal authenticated shell (header + nav + logout), mirroring the vehicles
// shell. The DS will replace this post-MVP (ADR 0013); keep it simple.
export default function MotoristasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <header className="flex items-center justify-between border-b border-zinc-200 py-4">
        <Link href="/veiculos" className="text-lg font-semibold">
          AMPARO Frota
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/veiculos" className="hover:underline">
            Veículos
          </Link>
          <Link href="/motoristas" className="hover:underline">
            Motoristas
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-zinc-500 hover:underline">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="py-6">{children}</main>
    </div>
  );
}
