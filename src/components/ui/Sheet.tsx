"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet (mobile-first; centred and width-capped on desktop). Built on vaul (Radix Dialog):
 * focus trap, Escape to close, drag to dismiss, background scroll lock.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  hideTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-[24px] border border-b-0 border-border bg-surface outline-none",
            className,
          )}
          aria-describedby={description ? undefined : undefined}
        >
          <div className="mx-auto mt-2.5 mb-1 h-1 w-10 shrink-0 rounded-full bg-border-strong" aria-hidden />
          <Drawer.Title className={cn("px-5 pt-2 text-title text-ink", hideTitle && "sr-only")}>{title}</Drawer.Title>
          {description ? <Drawer.Description className="px-5 pt-1 text-callout text-ink-2">{description}</Drawer.Description> : <Drawer.Description className="sr-only">{title}</Drawer.Description>}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-4">{children}</div>
          {footer ? <div className="pb-safe border-t border-border bg-surface px-5 pt-3 pb-4">{footer}</div> : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
