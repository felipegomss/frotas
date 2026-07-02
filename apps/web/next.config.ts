import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixa a raiz do monorepo. Sem isso, o Next infere errado quando há lockfiles
  // acima do repo (ex.: um package-lock.json no diretório-pai) e a resolução de
  // módulos/CSS pode apontar para a árvore errada.
  turbopack: { root: path.join(__dirname, "..", "..") },
  transpilePackages: ["@frotas/contracts", "@frotas/domain", "@frotas/ui"],
};

export default nextConfig;
