"use client";

import { useAtomValue } from "jotai";
import { raceProgressAtom } from "@/lib/atoms/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RaceResults() {
  const standings = useAtomValue(raceProgressAtom);

  if (standings.length === 0) return null;

  const sorted = [...standings].sort(
    (a, b) => b.progress - a.progress || b.wpm - a.wpm,
  );

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle className="text-sm">Race Results</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sorted.map((player, i) => (
          <div key={player.playerId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={i === 0 ? "default" : "outline"}>#{i + 1}</Badge>
              <span className="font-mono">{player.username}</span>
            </div>
            <span className="font-mono tabular-nums text-muted-foreground">
              {player.wpm} WPM
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
