"use client";

import { useAtomValue } from "jotai";
import { raceProgressAtom } from "@/lib/atoms/game";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type RaceProgressBarProps = {
  totalChars: number;
  currentPlayerId?: string;
};

export function RaceProgressBar({ totalChars, currentPlayerId }: RaceProgressBarProps) {
  const players = useAtomValue(raceProgressAtom);

  if (players.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4">
      {players.map((player) => {
        const pct = totalChars > 0 ? Math.min(100, (player.progress / totalChars) * 100) : 0;
        const isYou = player.playerId === currentPlayerId;

        return (
          <div key={player.playerId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={isYou ? "default" : "outline"} className="font-mono text-[10px]">
                  {isYou ? "you" : player.username}
                </Badge>
                <span className="text-muted-foreground">{player.wpm} WPM</span>
              </div>
              {player.finished && <span className="text-primary">finished</span>}
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
