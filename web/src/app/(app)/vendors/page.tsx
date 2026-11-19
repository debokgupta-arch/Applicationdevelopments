import type { Metadata } from "next";
import { Users } from "lucide-react";
import { copy } from "@/lib/copy";
import { SimplePage } from "@/components/kit/simple-page";

const text = copy.pages.vendors;

export const metadata: Metadata = { title: text.title };

export default function VendorsPage() {
  return (
    <SimplePage
      title={text.title}
      icon={Users}
      emptyTitle={text.emptyTitle}
      emptyBody={text.emptyBody}
    />
  );
}
