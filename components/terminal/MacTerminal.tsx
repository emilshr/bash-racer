import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MacTerminalProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function MacTerminal({ title = "bash — zsh", children, className }: MacTerminalProps) {
  return (
    <Card
      className={cn(
        "mx-auto flex h-[70vh] max-w-5xl flex-col gap-0 overflow-hidden p-0",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
        <div className="pointer-events-none flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center font-mono text-xs text-muted-foreground">{title}</span>
        <div className="w-12" />
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col bg-terminal-bg p-0 font-mono text-sm">
        {children}
      </CardContent>
    </Card>
  );
}
