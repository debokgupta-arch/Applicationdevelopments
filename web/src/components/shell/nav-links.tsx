import Link from "next/link";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "@/lib/navigation";

type NavLinksProps = {
  items: readonly NavItem[];
  variant: "tabs" | "sidebar";
  /** Current pathname, or null while it is unknown (prerender fallback). */
  pathname: string | null;
};

/** Presentational nav links shared by the desktop sidebar and the mobile tab bar. */
export function NavLinks({ items, variant, pathname }: NavLinksProps) {
  const isTabs = variant === "tabs";
  return (
    <ul className={isTabs ? "grid grid-cols-4" : "flex flex-col gap-1"}>
      {items.map(({ href, label, shortLabel, icon: Icon }) => {
        const active = isNavItemActive(href, pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isTabs
                  ? "min-h-16 flex-col justify-center gap-1 rounded-xl text-label"
                  : "min-h-11 gap-3 rounded-input px-3 text-body",
                active ? "text-primary-dark" : "text-muted-foreground hover:text-foreground",
                !isTabs && (active ? "bg-primary-tint" : "hover:bg-muted"),
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center",
                  isTabs && "h-8 w-14 rounded-full",
                  isTabs && active && "bg-primary-tint",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {isTabs ? shortLabel : label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
