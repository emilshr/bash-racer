"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  currentSnippetAtom,
  gameModeAtom,
  lobbyStatusAtom,
} from "@/lib/atoms/game";
import { playerIdAtom, usernameAtom, generateUsername } from "@/lib/atoms/session";
import { getRandomSnippet } from "@/lib/actions/snippets";
import { useSocket } from "@/lib/hooks/useSocket";
import { AppHeader } from "@/components/header/AppHeader";
import { MacTerminal } from "@/components/terminal/MacTerminal";
import { TypingSurface } from "@/components/terminal/TypingSurface";
import { LobbyStatus } from "@/components/race/LobbyStatus";
import { RaceProgressBar } from "@/components/race/RaceProgressBar";
import { RaceResults } from "@/components/race/RaceResults";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Snippet } from "@/lib/db/schema";

export function GameShell() {
  const mode = useAtomValue(gameModeAtom);
  const lobbyStatus = useAtomValue(lobbyStatusAtom);
  const onlineSnippet = useAtomValue(currentSnippetAtom);
  const [playerId] = useAtom(playerIdAtom);
  const [username, setUsername] = useAtom(usernameAtom);

  const [offlineSnippet, setOfflineSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, elapsedMs: 0 });
  const [snippetKey, setSnippetKey] = useState(0);

  const isOnline = mode === "online";
  const { emitProgress } = useSocket(isOnline);

  const activeText = isOnline ? onlineSnippet : (offlineSnippet?.content ?? "");
  const canType = isOnline ? lobbyStatus === "racing" : true;
  const surfaceLoading =
    loading || (isOnline && lobbyStatus !== "racing" && !onlineSnippet);

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
  }, []);

  useEffect(() => {
    if (!isOnline && !offlineSnippet) {
      void loadOfflineSnippet();
    }
  }, [isOnline, offlineSnippet, loadOfflineSnippet]);

  useEffect(() => {
    if (!username) {
      setUsername(generateUsername());
    }
  }, [username, setUsername]);

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 py-4">
      <AppHeader />

      {isOnline && (
        <>
          <LobbyStatus />
          <RaceProgressBar totalChars={activeText.length} currentPlayerId={playerId} />
          <Separator className="mx-auto max-w-5xl" />
        </>
      )}

      {!isOnline && (
        <StatsPanel wpm={stats.wpm} accuracy={stats.accuracy} elapsedMs={stats.elapsedMs} />
      )}

      <MacTerminal title={isOnline ? "bash-racer — lobby" : "bash-racer — practice"}>
        <TypingSurface
          key={`${isOnline ? "online" : "offline"}-${snippetKey}-${activeText.slice(0, 20)}`}
          text={activeText}
          loading={surfaceLoading}
          disabled={!canType}
          onProgress={isOnline ? emitProgress : undefined}
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

      {isOnline && lobbyStatus === "finished" && <RaceResults />}

      {isOnline && lobbyStatus === "racing" && (
        <StatsPanel wpm={stats.wpm} accuracy={stats.accuracy} elapsedMs={stats.elapsedMs} />
      )}
    </div>
  );
}
