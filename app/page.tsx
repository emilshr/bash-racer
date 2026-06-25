import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";
import { GameShellSkeleton } from "@/components/game/GameShellSkeleton";
import { Providers } from "@/components/providers";
import { fetchRandomSessionCommands } from "@/lib/db/snippets";

async function GameShellWithSession() {
  const initialCommands = await fetchRandomSessionCommands();
  return (
    <Providers initialCommands={initialCommands}>
      <GameShell />
    </Providers>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<GameShellSkeleton />}>
      <GameShellWithSession />
    </Suspense>
  );
}
