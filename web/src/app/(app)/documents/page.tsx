import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { copy } from "@/lib/copy";
import { SimplePage } from "@/components/kit/simple-page";

const text = copy.pages.documents;

export const metadata: Metadata = { title: text.title };

export default function DocumentsPage() {
  return (
    <SimplePage
      title={text.title}
      icon={FileText}
      emptyTitle={text.emptyTitle}
      emptyBody={text.emptyBody}
    />
  );
}
