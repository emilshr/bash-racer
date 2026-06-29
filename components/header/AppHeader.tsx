"use client";

import { useAtom } from "jotai";
import { Terminal } from "lucide-react";
import { gameModeAtom, type GameMode } from "@/lib/atoms/game";
import { usernameAtom } from "@/lib/atoms/session";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AppHeader() {
  const [mode, setMode] = useAtom(gameModeAtom);
  const [username] = useAtom(usernameAtom);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Terminal className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">Bash Racer</span>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
        <TabsList>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="online">Race Lobby</TabsTrigger>
        </TabsList>
      </Tabs>

      {username ? (
        <Badge variant="secondary" className="font-mono text-xs">
          {username}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs">
          connecting…
        </Badge>
      )}
    </header>
  );
}
