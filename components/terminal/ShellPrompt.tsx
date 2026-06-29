"use client";

import { useEffect, useState } from "react";

type ShellPromptProps = {
  username: string;
  branch?: string;
};

export function ShellPrompt({ username }: ShellPromptProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = mounted && username ? username : "guest";

  return (
    <span className="shrink-0 select-none">
      <span className="text-terminal-prompt-user">{displayName}</span>
      <span className="text-terminal-prompt-at">@</span>
      <span className="text-terminal-prompt-host">bashracer</span>
      {/* <span className="text-terminal-prompt-git"> git:</span>
      <span className="text-terminal-prompt-git">(</span>
      <span className="text-terminal-prompt-branch">{branch}</span>
      <span className="text-terminal-prompt-git">)</span> */}
      <span className="text-terminal-prompt"> $ </span>
    </span>
  );
}
