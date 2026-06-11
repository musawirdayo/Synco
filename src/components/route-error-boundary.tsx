import { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
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
      {error && (
        <pre className="text-left bg-card border border-border rounded p-3 font-mono text-[10px] text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
          {error.message || String(error)}
        </pre>
      )}
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
