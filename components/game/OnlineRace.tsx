"use client";

import { type RefObject } from "react";
import { useAtomValue } from "jotai";
import { lobbyStatusAtom } from "@/lib/atoms/game";
import { useSocket } from "@/lib/hooks/useSocket";
import { LobbyStatus } from "@/components/race/LobbyStatus";
import { RaceProgressBar } from "@/components/race/RaceProgressBar";
import { RaceResults } from "@/components/race/RaceResults";
import { StatsPanel } from "@/components/stats/StatsPanel";

type OnlineRaceProps = {
  totalChars: number;
  currentPlayerId: string;
  stats: { wpm: number; accuracy: number; elapsedMs: number };
  emitProgressRef: RefObject<(index: number, wpm: number) => void>;
};

export function OnlineRace({
  totalChars,
  currentPlayerId,
  stats,
  emitProgressRef,
}: OnlineRaceProps) {
  const lobbyStatus = useAtomValue(lobbyStatusAtom);
  const { emitProgress } = useSocket(true);

  emitProgressRef.current = emitProgress;

  return (
    <>
      <LobbyStatus />
      <RaceProgressBar totalChars={totalChars} currentPlayerId={currentPlayerId} />
      {lobbyStatus === "finished" && <RaceResults />}
      {lobbyStatus === "racing" && (
        <StatsPanel wpm={stats.wpm} accuracy={stats.accuracy} elapsedMs={stats.elapsedMs} />
      )}
    </>
  );
}
