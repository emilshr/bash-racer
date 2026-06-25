"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { lobbyCountdownEndsAtAtom, lobbyStatusAtom, raceProgressAtom } from "@/lib/atoms/game";
import { Badge } from "@/components/ui/badge";

const statusVariant = {
  waiting: "outline",
  countdown: "secondary",
  racing: "default",
  finished: "destructive",
} as const;

const statusLabel = {
  waiting: "Waiting for players…",
  countdown: "Race starts soon",
  racing: "Racing!",
  finished: "Race finished",
};

export function LobbyStatus() {
  const status = useAtomValue(lobbyStatusAtom);
  const countdownEndsAt = useAtomValue(lobbyCountdownEndsAtAtom);
  const players = useAtomValue(raceProgressAtom);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "countdown" || !countdownEndsAt) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((countdownEndsAt - Date.now()) / 1000));
      setSecondsLeft(left);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [status, countdownEndsAt]);

  return (
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 text-sm">
      <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
      <span className="text-muted-foreground">
        {players.length} / 5 players
        {secondsLeft !== null && ` · ${secondsLeft}s`}
      </span>
    </div>
  );
}
