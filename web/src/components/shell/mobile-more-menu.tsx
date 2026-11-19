"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { copy } from "@/lib/copy";
import { MORE_MENU_ITEMS } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** On mobile, Documents and Settings live here instead of the tab bar. */
export function MobileMoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={copy.shell.moreMenu}
          className="lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {MORE_MENU_ITEMS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild className="min-h-11">
            <Link href={href}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
