"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Failed to load the game. Please try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}
