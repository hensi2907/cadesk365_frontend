import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DetailDrawer({ open, onOpenChange, title, subtitle, children, footer, className }: DetailDrawerProps) {
  React.useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background border-l shadow-xl sm:max-w-lg md:max-w-xl",
        "animate-in slide-in-from-right duration-200",
        className
      )}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-semibold tracking-tight truncate">{title}</h2>
            {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
        {footer && (
          <div className="border-t bg-muted/30 px-5 py-3">{footer}</div>
        )}
      </div>
    </>
  );
}
