"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="sm"
      icon="logout"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
