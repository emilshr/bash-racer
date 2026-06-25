"use client";

import { getDefaultStore, Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionBootstrap } from "@/components/session-bootstrap";
import { offlineSnippetAtom } from "@/lib/atoms/game";
import type { Snippet } from "@/lib/db/schema";

type HydrateAtomsProps = {
  initialSnippet: Snippet | null;
  children: React.ReactNode;
};

function HydrateAtoms({ initialSnippet, children }: HydrateAtomsProps) {
  useHydrateAtoms([[offlineSnippetAtom, initialSnippet]]);
  return children;
}

export function Providers({ initialSnippet, children }: HydrateAtomsProps) {
  return (
    <Provider store={getDefaultStore()}>
      <SessionBootstrap />
      <HydrateAtoms initialSnippet={initialSnippet}>
        <TooltipProvider>{children}</TooltipProvider>
      </HydrateAtoms>
    </Provider>
  );
}
