"use client";

import * as React from "react";
import { RiArrowRightSLine, RiLogoutBoxRLine } from "@remixicon/react";

import { Avatar, AvatarFallback } from "@frotas/ui/components/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@frotas/ui/components/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@frotas/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@frotas/ui/components/dropdown-menu";
import { Kbd, KbdGroup } from "@frotas/ui/components/kbd";
import { Separator } from "@frotas/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@frotas/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@frotas/ui/components/tooltip";
import { cn } from "@frotas/ui/lib/utils";

/**
 * Shell de aplicação do DS: sidebar colapsável + header com breadcrumb e menu
 * do usuário. Agnóstico de framework — o app injeta o componente de link (ex.:
 * next/link) e resolve o estado ativo dos itens.
 */

/** Componente de link do app (ex.: next/link). Precisa aceitar `href`. */
export type AppShellLinkComponent = React.ElementType;

export interface AppShellNavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  subItems?: AppShellNavItem[];
}

export interface AppShellNavGroup {
  label?: string;
  items: AppShellNavItem[];
}

export interface AppShellBrand {
  title: string;
  subtitle?: string;
  href: string;
  logo?: React.ReactNode;
}

export interface AppShellUser {
  name: string;
  /** Linha secundária no menu (ex.: papel do usuário no tenant). */
  detail?: string;
}

export interface AppShellBreadcrumbSegment {
  title: string;
  href?: string;
}

export interface AppShellProps {
  brand: AppShellBrand;
  navGroups: AppShellNavGroup[];
  /** Trilha da página atual; o último segmento é a página corrente. */
  breadcrumbs?: AppShellBreadcrumbSegment[];
  user?: AppShellUser;
  /** Server action (ou handler) do formulário de logout. */
  logoutAction?: (formData: FormData) => void | Promise<void>;
  logoutLabel?: string;
  /** Ações extras no lado direito do header. */
  headerActions?: React.ReactNode;
  linkComponent?: AppShellLinkComponent;
  children: React.ReactNode;
}

export function AppShell({
  brand,
  navGroups,
  breadcrumbs,
  user,
  logoutAction,
  logoutLabel = "Sair",
  headerActions,
  linkComponent: Link = "a",
  children,
}: AppShellProps) {
  return (
    <TooltipProvider>
      <div className="overflow-hidden">
        <SidebarProvider className="relative h-svh">
          <AppShellSidebar brand={brand} navGroups={navGroups} Link={Link} />
          <SidebarInset className="md:peer-data-[variant=inset]:ml-0">
            <AppShellHeader
              breadcrumbs={breadcrumbs}
              user={user}
              logoutAction={logoutAction}
              logoutLabel={logoutLabel}
              headerActions={headerActions}
              Link={Link}
            />
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  );
}

function AppShellSidebar({
  brand,
  navGroups,
  Link,
}: {
  brand: AppShellBrand;
  navGroups: AppShellNavGroup[];
  Link: AppShellLinkComponent;
}) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenuButton className="h-10" render={<Link href={brand.href} />}>
          {brand.logo}
          <span className="grid leading-tight">
            <span className="font-heading font-semibold">{brand.title}</span>
            {brand.subtitle && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                {brand.subtitle}
              </span>
            )}
          </span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group, index) => (
          <AppShellNavGroupSection
            key={group.label ?? `nav-group-${index}`}
            group={group}
            Link={Link}
          />
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

function AppShellNavGroupSection({
  group,
  Link,
}: {
  group: AppShellNavGroup;
  Link: AppShellLinkComponent;
}) {
  return (
    <SidebarGroup>
      {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarMenu>
        {group.items.map((item) => (
          <Collapsible
            key={item.title}
            className="group/collapsible"
            defaultOpen={
              !!item.isActive || item.subItems?.some((sub) => !!sub.isActive)
            }
            render={<SidebarMenuItem />}
          >
            {item.subItems?.length ? (
              <>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltip={item.title}
                    />
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <RiArrowRightSLine className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          isActive={subItem.isActive}
                          render={<Link href={subItem.href ?? "#"} />}
                        >
                          {subItem.icon}
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : (
              <SidebarMenuButton
                isActive={item.isActive}
                tooltip={item.title}
                render={<Link href={item.href ?? "#"} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            )}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function AppShellHeader({
  breadcrumbs,
  user,
  logoutAction,
  logoutLabel,
  headerActions,
  Link,
}: {
  breadcrumbs?: AppShellBreadcrumbSegment[];
  user?: AppShellUser;
  logoutAction?: (formData: FormData) => void | Promise<void>;
  logoutLabel: string;
  headerActions?: React.ReactNode;
  Link: AppShellLinkComponent;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 md:px-6",
      )}
    >
      <div className="flex items-center gap-3">
        <AppShellSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppShellBreadcrumbs breadcrumbs={breadcrumbs} Link={Link} />
      </div>
      <div className="flex items-center gap-3">
        {headerActions}
        {user && (
          <AppShellUserMenu
            user={user}
            logoutAction={logoutAction}
            logoutLabel={logoutLabel}
          />
        )}
      </div>
    </header>
  );
}

function AppShellSidebarTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger delay={1000} render={<SidebarTrigger />} />
      <TooltipContent className="px-2 py-1" side="right">
        Alternar menu{" "}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>b</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}

function AppShellBreadcrumbs({
  breadcrumbs,
  Link,
}: {
  breadcrumbs?: AppShellBreadcrumbSegment[];
  Link: AppShellLinkComponent;
}) {
  if (!breadcrumbs?.length) return null;

  const parents = breadcrumbs.slice(0, -1);
  const current = breadcrumbs[breadcrumbs.length - 1]!;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {parents.map((segment) => (
          <React.Fragment key={segment.title}>
            <BreadcrumbItem>
              {segment.href ? (
                <BreadcrumbLink render={<Link href={segment.href} />}>
                  {segment.title}
                </BreadcrumbLink>
              ) : (
                segment.title
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{current.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function AppShellUserMenu({
  user,
  logoutAction,
  logoutLabel,
}: {
  user: AppShellUser;
  logoutAction?: (formData: FormData) => void | Promise<void>;
  logoutLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={<Avatar className="size-8" />}
      >
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {initialsOf(user.name)}
        </AvatarFallback>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid leading-tight">
            <span className="truncate font-medium text-foreground">
              {user.name}
            </span>
            {user.detail && (
              <span className="truncate text-muted-foreground text-xs">
                {user.detail}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        {logoutAction && (
          <>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem
                variant="destructive"
                render={<button className="w-full" type="submit" />}
              >
                <RiLogoutBoxRLine />
                {logoutLabel}
              </DropdownMenuItem>
            </form>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
