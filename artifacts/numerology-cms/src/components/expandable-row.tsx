import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExpandableRowProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function ExpandableRow({ header, children, className, defaultOpen = false }: ExpandableRowProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("border-border transition-colors", open && "border-primary/30", className)}>
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer select-none transition-colors"
        >
          <div className="flex-1 min-w-0">{header}</div>
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
              open && "rotate-90"
            )}
          />
        </div>
        {open && (
          <div className="px-4 pb-4 pt-3 border-t border-border/50">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
