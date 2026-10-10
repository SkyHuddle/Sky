import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-4" aria-busy aria-label="Loading player pool">
      <Skeleton className="mb-4 h-14 w-full rounded-2xl" />
      <div className="mb-4 grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="mx-auto size-12 rounded-full" />
        ))}
      </div>
      <Skeleton className="mb-3 h-11 w-full rounded-xl" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="mb-2 h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
