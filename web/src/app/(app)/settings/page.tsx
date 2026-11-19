import { Suspense } from "react";
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { copy } from "@/lib/copy";
import { requireUser } from "@/lib/auth/session";
import { getDevUser } from "@/lib/auth/dev-backend";
import { authMode } from "@/lib/env";
import { EmptyState } from "@/components/kit/empty-state";
import { PageHeader } from "@/components/kit/page-header";
import { ProfileForm } from "./profile-form";

const text = copy.pages.settings;

export const metadata: Metadata = { title: text.title };

/** Which contacts are verified (local backend tracks this; Supabase only signs in verified users). */
async function verification(userId: string) {
  if (authMode() !== "dev") return { email: true, mobile: true };
  const user = await getDevUser(userId);
  return { email: Boolean(user?.emailConfirmedAt), mobile: Boolean(user?.phoneConfirmedAt) };
}

async function Profile() {
  const user = await requireUser();
  const verified = await verification(user.id);
  return (
    <ProfileForm
      displayName={user.displayName}
      username={user.username}
      email={user.email}
      mobile={user.mobile}
      emailVerified={verified.email}
      mobileVerified={verified.mobile}
    />
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title={text.title} />
      <Suspense fallback={<div className="h-72 animate-pulse rounded-card bg-muted" />}>
        <Profile />
      </Suspense>
      <EmptyState icon={Settings} title={text.emptyTitle} description={text.emptyBody} />
    </>
  );
}
