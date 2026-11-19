import Link from "next/link";
import { House } from "lucide-react";
import { copy } from "@/lib/copy";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2.5 rounded-input px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-9 items-center justify-center rounded-input bg-primary text-primary-foreground">
        <House className="size-5" aria-hidden="true" />
      </span>
      <span className="text-section font-extrabold tracking-tight">{copy.appName}</span>
    </Link>
  );
}
