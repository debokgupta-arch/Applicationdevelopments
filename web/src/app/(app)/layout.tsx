import { AppShell } from "@/components/shell/app-shell";

/** Signed-in area: sidebar / tab bar, top bar and the shared Add item dialog. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
