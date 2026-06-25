"use client";

import { HelpCircle } from "lucide-react";
import { formatTime } from "@/lib/typing/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StatsPanelProps = {
  wpm: number;
  accuracy: number;
  elapsedMs: number;
};

function StatCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatsPanel({ wpm, accuracy, elapsedMs }: StatsPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl gap-4 px-4">
      <StatCard
        label="WPM"
        value={String(wpm)}
        tooltip="Words per minute — 5 characters = 1 word"
      />
      <StatCard label="Accuracy" value={`${accuracy}%`} tooltip="Correct keystrokes / total keystrokes" />
      <StatCard label="Time" value={formatTime(elapsedMs)} tooltip="Elapsed time since first keystroke" />
    </div>
  );
}
