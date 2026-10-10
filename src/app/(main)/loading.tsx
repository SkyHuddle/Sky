import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <Skeleton className="h-64 w-full rounded-[24px]" />
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}
