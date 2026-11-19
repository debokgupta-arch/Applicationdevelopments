"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { formatShortDate } from "@/lib/format";
import { setCurrentHome } from "@/lib/data/home-actions";
import type { HomeSummary } from "@/lib/data/homes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CurrentHomeCardProps = { homes: readonly HomeSummary[]; currentId: string };

/** "Current home" card that doubles as the home switcher. */
export function CurrentHomeCard({ homes, currentId }: CurrentHomeCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const home = homes.find((h) => h.id === currentId) ?? homes[0];
  if (!home) return null;

  const choose = (id: string) =>
    startTransition(async () => {
      await setCurrentHome(id);
      router.refresh();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${copy.shell.switchHome}: ${home.name}`}
        aria-busy={pending || undefined}
        className="flex w-full items-center gap-2 rounded-card border bg-background p-3 text-left outline-none hover:border-input focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-label font-bold text-muted-foreground">
            {copy.shell.currentHome}
          </span>
          <span className="block truncate text-body font-bold">{home.name}</span>
          {home.moveInDate && (
            <span className="block text-label text-muted-foreground">
              {copy.shell.moveInOn(formatShortDate(home.moveInDate))}
            </span>
          )}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{copy.shell.yourHomes}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={home.id} onValueChange={choose}>
          {homes.map((h) => (
            <DropdownMenuRadioItem key={h.id} value={h.id} className="min-h-11">
              {h.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11">
          <Link href="/onboarding">
            <Plus className="size-4" aria-hidden="true" />
            {copy.shell.addHome}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
