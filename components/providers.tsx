"use client";

import { Provider } from "jotai";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <TooltipProvider>{children}</TooltipProvider>
    </Provider>
  );
}
