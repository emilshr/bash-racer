"use client";

import { useSyncExternalStore } from "react";
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

function useCountdownNow(active: boolean) {
  return useSyncExternalStore(
    (callback) => {
      if (!active) return () => {};
      const id = setInterval(callback, 250);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => 0,
  );
}

export function LobbyStatus() {
  const status = useAtomValue(lobbyStatusAtom);
  const countdownEndsAt = useAtomValue(lobbyCountdownEndsAtAtom);
  const players = useAtomValue(raceProgressAtom);
  const ticking = status === "countdown" && countdownEndsAt !== null;
  const now = useCountdownNow(ticking);

  const secondsLeft =
    ticking && countdownEndsAt
      ? Math.max(0, Math.ceil((countdownEndsAt - now) / 1000))
      : null;

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
