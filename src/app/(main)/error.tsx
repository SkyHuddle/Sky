"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/primitives";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon="alert"
      title="Something went wrong"
      body="We couldn't load this page. Your teams and saved data are safe."
      action={
        <Button variant="secondary" icon="refresh" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
