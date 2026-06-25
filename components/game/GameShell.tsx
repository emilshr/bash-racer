"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  currentSnippetAtom,
  gameModeAtom,
  lobbyStatusAtom,
  offlineSnippetAtom,
} from "@/lib/atoms/game";
import { playerIdAtom } from "@/lib/atoms/session";
import { getRandomSnippet } from "@/lib/actions/snippets";
import { AppHeader } from "@/components/header/AppHeader";
import { MacTerminal } from "@/components/terminal/MacTerminal";
import { TypingSurface } from "@/components/terminal/TypingSurface";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const OnlineRace = dynamic(
  () => import("@/components/game/OnlineRace").then((m) => ({ default: m.OnlineRace })),
  { ssr: false },
);

export function GameShell() {
  const mode = useAtomValue(gameModeAtom);
  const lobbyStatus = useAtomValue(lobbyStatusAtom);
  const onlineSnippet = useAtomValue(currentSnippetAtom);
  const [playerId] = useAtom(playerIdAtom);
  const [offlineSnippet, setOfflineSnippet] = useAtom(offlineSnippetAtom);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, elapsedMs: 0 });
  const [snippetKey, setSnippetKey] = useState(0);
  const emitProgressRef = useRef<(index: number, wpm: number) => void>(() => {});

  const isOnline = mode === "online";

  const activeText = isOnline ? onlineSnippet : (offlineSnippet?.content ?? "");
  const canType = isOnline ? lobbyStatus === "racing" : true;
  const surfaceLoading =
    loading || (isOnline && lobbyStatus !== "racing" && !onlineSnippet);

  const handleOnlineProgress = useCallback((index: number, wpm: number) => {
    emitProgressRef.current(index, wpm);
  }, []);

  const loadOfflineSnippet = useCallback(async () => {
    setLoading(true);
    try {
      const snippet = await getRandomSnippet();
      setOfflineSnippet(snippet);
      setSnippetKey((k) => k + 1);
      setStats({ wpm: 0, accuracy: 100, elapsedMs: 0 });
    } finally {
      setLoading(false);
    }
  }, [setOfflineSnippet]);

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 py-4">
      <AppHeader />

      {isOnline && (
        <OnlineRace
          totalChars={activeText.length}
          currentPlayerId={playerId}
          stats={stats}
          emitProgressRef={emitProgressRef}
        />
      )}

      {isOnline && <Separator className="mx-auto max-w-5xl" />}

      {!isOnline && (
        <StatsPanel wpm={stats.wpm} accuracy={stats.accuracy} elapsedMs={stats.elapsedMs} />
      )}

      <MacTerminal title={isOnline ? "bash-racer — lobby" : "bash-racer — practice"}>
        <TypingSurface
          key={`${isOnline ? "online" : "offline"}-${snippetKey}-${activeText.slice(0, 20)}`}
          text={activeText}
          loading={surfaceLoading}
          disabled={!canType}
          onProgress={isOnline ? handleOnlineProgress : undefined}
          onStatsChange={setStats}
        />
      </MacTerminal>

      {!isOnline && (
        <div className="mx-auto flex w-full max-w-5xl justify-center px-4">
          <Button variant="outline" onClick={() => void loadOfflineSnippet()} disabled={loading}>
            New snippet
          </Button>
        </div>
      )}
    </div>
  );
}
