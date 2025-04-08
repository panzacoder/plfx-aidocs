"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import type { api } from "@v1/backend/convex/_generated/api";
import { Button, buttonVariants } from "@v1/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { cn } from "@v1/ui/utils";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  LogOut,
  Settings,
  Slash,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";

export function Navigation({
  preloadedUser,
}: {
  preloadedUser: Preloaded<typeof api.users.functions.getUser>;
}) {
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const router = useRouter();
  const isDashboardPath = pathname === "/";
  const isPublishPath = pathname === "/publish";
  const isSettingsPath = pathname.startsWith("/settings");

  console.log({ isSettingsPath });

  const user = usePreloadedQuery(preloadedUser);

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 flex w-full flex-col border-b border-border bg-card px-6">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between py-3">
        <div className="flex h-10 items-center gap-2">
          <Link href="/" className="flex h-10 items-center gap-1">
            <Image src="/logo.png" alt="logo" width={50} height={50} />
          </Link>
          <Slash className="h-6 w-6 -rotate-12 stroke-[1.5px] text-primary/10" />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-2 data-[state=open]:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      alt={user.name ?? user.email}
                      src={user.avatarUrl}
                    />
                  ) : (
                    <span className="h-8 w-8 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                  )}

                  <p className="text-sm font-medium text-primary/80">
                    {user?.name || ""}
                  </p>
                  <span className="flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary/80">
                    Free
                  </span>
                </div>
                <span className="flex flex-col items-center justify-center">
                  <ChevronUp className="relative top-[3px] h-[14px] w-[14px] stroke-[1.5px] text-primary/60" />
                  <ChevronDown className="relative bottom-[3px] h-[14px] w-[14px] stroke-[1.5px] text-primary/60" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="min-w-56 bg-card p-2"
            >
              <DropdownMenuLabel className="flex items-center text-xs font-normal text-primary/60">
                Personal Account
              </DropdownMenuLabel>
              <DropdownMenuItem className="h-10 w-full cursor-pointer justify-between rounded-md bg-secondary px-2">
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      className="h-6 w-6 rounded-full object-cover"
                      alt={user.name ?? user.email}
                      src={user.avatarUrl}
                    />
                  ) : (
                    <span className="h-6 w-6 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                  )}

                  <p className="text-sm font-medium text-primary/80">
                    {user.name || ""}
                  </p>
                </div>
                <Check className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60" />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-0 my-2" />
              <DropdownMenuItem className="p-0 focus:bg-transparent">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => router.push("/settings/billing")}
                >
                  Upgrade to PRO
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex h-10 items-center gap-3">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                {user.avatarUrl ? (
                  <img
                    className="min-h-8 min-w-8 rounded-full object-cover"
                    alt={user.name ?? user.email}
                    src={user.avatarUrl}
                  />
                ) : (
                  <span className="min-h-8 min-w-8 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="fixed -right-4 min-w-56 bg-card p-2"
            >
              <DropdownMenuItem className="group flex-col items-start focus:bg-transparent">
                <p className="text-sm font-medium text-primary/80 group-hover:text-primary group-focus:text-primary">
                  {user?.name || ""}
                </p>
                <p className="text-sm text-primary/60">{user?.email}</p>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="group h-9 w-full cursor-pointer justify-between rounded-md px-2"
                onClick={() => router.push("/settings")}
              >
                <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                  Settings
                </span>
                <Settings className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60 group-hover:text-primary group-focus:text-primary" />
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  "group flex h-9 justify-between rounded-md px-2 hover:bg-transparent",
                )}
              >
                <span className="w-full text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                  Theme
                </span>
                <ThemeSwitcher />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-0 my-2" />

              <DropdownMenuItem
                className="group h-9 w-full cursor-pointer justify-between rounded-md px-2"
                onClick={() => signOut()}
              >
                <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                  Log Out
                </span>
                <LogOut className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60 group-hover:text-primary group-focus:text-primary" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-screen-xl items-center gap-3">
        <div
          className={cn(
            "flex h-12 items-center border-b-2",
            isDashboardPath ? "border-primary" : "border-transparent",
          )}
        >
          <Link
            href="/"
            className={cn(
              `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80`,
            )}
          >
            Dashboard
          </Link>
        </div>

        <div
          className={cn(
            "flex h-12 items-center border-b-2",
            isPublishPath ? "border-primary" : "border-transparent",
          )}
        >
          <Link
            href="/publish"
            className={cn(
              `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80`,
            )}
          >
            Publish
          </Link>
        </div>

        <div
          className={cn(
            "flex h-12 items-center border-b-2",
            isSettingsPath ? "border-primary" : "border-transparent",
          )}
        >
          <Link
            href="/settings"
            className={cn(
              `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80`,
            )}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
