import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 sm:px-6 md:px-12 py-5 sm:py-6">
        <Link
          to="/"
          className="font-display text-lg sm:text-xl md:text-2xl tracking-tight hover:opacity-80 transition-opacity"
        >
          Synco
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mb-2">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted mb-6 sm:mb-8">{subtitle}</p>}
          {children}
          {footer && <div className="mt-6 text-xs sm:text-sm text-muted text-center">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PrimaryButton({
  loading,
  children,
  ...props
}: { loading?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={
        "w-full h-11 sm:h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-[color:var(--color-primary-hover)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed " +
        (props.className ?? "")
      }
    >
      {loading ? "Working..." : children}
    </button>
  );
}

export const inputClass =
  "w-full h-11 px-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200 text-sm";
