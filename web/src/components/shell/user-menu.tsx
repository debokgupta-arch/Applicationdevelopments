"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { copy } from "@/lib/copy";
import { initialsOf } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Initials avatar that opens the account menu (settings, sign out). */
export function UserMenu({ name, detail }: { name: string; detail: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${copy.auth.userMenu}: ${copy.shell.account(name)}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-label font-extrabold text-primary-dark outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {initialsOf(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-bold text-foreground">{name}</span>
          <span className="truncate text-label font-normal text-muted-foreground">{detail}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11">
          <Link href="/settings">
            <Settings className="size-4" aria-hidden="true" />
            {copy.nav.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11" onSelect={() => void signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          {copy.auth.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
