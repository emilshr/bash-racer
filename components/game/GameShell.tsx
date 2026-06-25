"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  commandSessionAtom,
  createCommandSession,
  gameModeAtom,
  lobbyStatusAtom,
  currentSnippetAtom,
} from "@/lib/atoms/game";
import { playerIdAtom, usernameAtom } from "@/lib/atoms/session";
import { getRandomSession } from "@/lib/actions/snippets";
import { Loader2 } from "lucide-react";
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
  const [username] = useAtom(usernameAtom);
  const [, setSession] = useAtom(commandSessionAtom);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, elapsedMs: 0 });
  const [sessionKey, setSessionKey] = useState(0);
  const emitProgressRef = useRef<(index: number, wpm: number) => void>(() => {});

  const isOnline = mode === "online";

  const activeText = isOnline ? onlineSnippet : "";
  const canType = isOnline ? lobbyStatus === "racing" : true;
  const surfaceLoading = loading || (isOnline && lobbyStatus !== "racing" && !onlineSnippet);

  const handleOnlineProgress = useCallback((index: number, wpm: number) => {
    emitProgressRef.current(index, wpm);
  }, []);

  const loadNewSession = useCallback(async () => {
    setLoading(true);
    try {
      const commands = await getRandomSession();
      setSession(createCommandSession(commands));
      setSessionKey((k) => k + 1);
      setStats({ wpm: 0, accuracy: 100, elapsedMs: 0 });
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4">
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
        {isOnline ? (
          <TypingSurface
            key={`online-${activeText.slice(0, 20)}`}
            text={activeText}
            username={username}
            branch="race"
            loading={surfaceLoading}
            disabled={!canType}
            onProgress={handleOnlineProgress}
            onStatsChange={setStats}
          />
        ) : (
          <TypingSurface
            key={`offline-${sessionKey}`}
            username={username}
            branch="practice"
            loading={surfaceLoading}
            disabled={!canType}
            onStatsChange={setStats}
          />
        )}
      </MacTerminal>

      {!isOnline && (
        <div className="mx-auto flex w-full max-w-5xl justify-center px-4">
          <Button variant="outline" onClick={() => void loadNewSession()} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            New session
          </Button>
        </div>
      )}
    </div>
  );
}
