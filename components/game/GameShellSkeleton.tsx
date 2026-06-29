import { Skeleton } from "@/components/ui/skeleton";

export function GameShellSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 py-4">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto flex h-[70vh] w-[80vw] flex-col gap-0 overflow-hidden rounded-xl border border-border">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
