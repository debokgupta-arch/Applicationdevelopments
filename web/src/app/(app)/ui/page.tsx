import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { PageHeader } from "@/components/kit/page-header";
import { ComponentGallery } from "./component-gallery";

export const metadata: Metadata = {
  title: copy.pages.gallery.title,
  robots: { index: false, follow: false },
};

/** Review page for the shared design-system components (not linked from the nav). */
export default function ComponentsPage() {
  return (
    <>
      <PageHeader title={copy.pages.gallery.title} subtitle={copy.pages.gallery.subtitle} />
      <ComponentGallery />
    </>
  );
}
