import { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  console.error(error);

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 my-6 text-center space-y-4 max-w-lg mx-auto">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Section load failed</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          There was an error rendering this part of the application.
        </p>
      </div>
      <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        We could not show this section safely. Please try again in a moment.
      </p>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => reset()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-[color:var(--color-primary-hover)] transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Try again
        </button>
      </div>
    </div>
  );
}
