"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiCarLine, RiSteering2Line, RiTruckLine } from "@remixicon/react";
import {
  AppShell,
  type AppShellBreadcrumbSegment,
  type AppShellNavGroup,
  type AppShellUser,
} from "@frotas/ui/components/app-shell";

interface WebShellProps {
  user?: AppShellUser;
  logoutAction: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}

/** Shell do app web: configura marca, navegação e breadcrumbs sobre o AppShell do DS. */
export function WebShell({ user, logoutAction, children }: WebShellProps) {
  const pathname = usePathname();

  return (
    <AppShell
      brand={{
        title: "AMPARO Frota",
        subtitle: "Gestão de frota pública",
        href: "/veiculos",
        logo: (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <RiTruckLine className="size-4" />
          </span>
        ),
      }}
      navGroups={navGroups(pathname)}
      breadcrumbs={breadcrumbsFor(pathname)}
      user={user}
      logoutAction={logoutAction}
      linkComponent={Link}
    >
      {children}
    </AppShell>
  );
}

function navGroups(pathname: string): AppShellNavGroup[] {
  return [
    {
      label: "Frota",
      items: [
        {
          title: "Veículos",
          href: "/veiculos",
          icon: <RiCarLine />,
          isActive: pathname.startsWith("/veiculos"),
        },
        {
          title: "Motoristas",
          href: "/motoristas",
          icon: <RiSteering2Line />,
          isActive: pathname.startsWith("/motoristas"),
        },
      ],
    },
  ];
}

const SECTIONS: Record<string, { title: string; newTitle: string; editTitle: string }> = {
  veiculos: {
    title: "Veículos",
    newTitle: "Novo veículo",
    editTitle: "Editar veículo",
  },
  motoristas: {
    title: "Motoristas",
    newTitle: "Novo motorista",
    editTitle: "Editar motorista",
  },
};

function breadcrumbsFor(pathname: string): AppShellBreadcrumbSegment[] {
  const [section, ...rest] = pathname.split("/").filter(Boolean);
  const config = section ? SECTIONS[section] : undefined;
  if (!config) return [];

  const root: AppShellBreadcrumbSegment = {
    title: config.title,
    href: `/${section}`,
  };

  if (rest.length === 0) return [{ title: config.title }];
  if (rest[0] === "novo") return [root, { title: config.newTitle }];
  if (rest.length === 1) return [root, { title: "Detalhes" }];
  if (rest[1] === "editar") return [root, { title: config.editTitle }];
  return [root];
}
