"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { copy } from "@/lib/copy";

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * One accessible dialog that is a bottom sheet below 1024px and a centred
 * 600px dialog above it. Layout is pure CSS, so there is no hydration flicker.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ResponsiveDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/45 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-dialog bg-card shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[600px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-dialog lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=open]:zoom-in-95"
        >
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-input lg:hidden"
          />
          <div className="flex items-start gap-3 px-6 pt-4 lg:pt-6">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-section font-extrabold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-body text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label={copy.dialog.close}
              className="-mt-2 -mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
