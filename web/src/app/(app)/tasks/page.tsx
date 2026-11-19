import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { copy } from "@/lib/copy";
import { SimplePage } from "@/components/kit/simple-page";

const text = copy.pages.tasks;

export const metadata: Metadata = { title: text.title };

export default function TasksPage() {
  return (
    <SimplePage
      title={text.title}
      icon={ListChecks}
      emptyTitle={text.emptyTitle}
      emptyBody={text.emptyBody}
    />
  );
}
