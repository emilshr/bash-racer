import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";
import { GameShellSkeleton } from "@/components/game/GameShellSkeleton";
import { Providers } from "@/components/providers";
import { fetchRandomSnippet } from "@/lib/db/snippets";

async function GameShellWithSnippet() {
  const initialSnippet = await fetchRandomSnippet();
  return (
    <Providers initialSnippet={initialSnippet}>
      <GameShell />
    </Providers>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<GameShellSkeleton />}>
      <GameShellWithSnippet />
    </Suspense>
  );
}
