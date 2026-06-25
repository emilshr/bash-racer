"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionBootstrap } from "@/components/session-bootstrap";
import { commandSessionAtom, createCommandSession } from "@/lib/atoms/game";

type ProvidersProps = {
  initialCommands: string[];
  children: React.ReactNode;
};

function HydrateAtoms({ initialCommands, children }: ProvidersProps) {
  useHydrateAtoms([[commandSessionAtom, createCommandSession(initialCommands)]]);
  return children;
}

export function Providers({ initialCommands, children }: ProvidersProps) {
  return (
    <Provider>
      <SessionBootstrap />
      <HydrateAtoms initialCommands={initialCommands}>
        <TooltipProvider>{children}</TooltipProvider>
      </HydrateAtoms>
    </Provider>
  );
}
