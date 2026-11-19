import { CenteredLayout } from "@/components/shell/centered-layout";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <CenteredLayout>{children}</CenteredLayout>;
}
