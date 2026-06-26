import React, { ReactNode, useId } from "react";
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-4 py-5 sm:px-6 sm:py-6 md:px-12">
        <Link
          to="/"
          className="font-sans text-base font-semibold tracking-normal transition-colors hover:text-[color:var(--color-primary)] sm:text-lg"
        >
          Synco
        </Link>
      </header>
      <main className="grid flex-1 gap-6 px-4 pb-8 sm:px-6 sm:pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <aside className="hidden min-h-[calc(100vh-8rem)] rounded-[8px] border border-primary/15 bg-primary p-8 text-primary-foreground shadow-[0_18px_50px_oklch(0.18_0_0_/_0.08)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">One account</p>
            <h2 className="mt-4 max-w-sm font-sans text-4xl font-semibold leading-tight tracking-normal">
              Keep every class, survey, and result in one place.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-primary-foreground/75">
              Sign in from any device and Synco keeps your classes, responses, and results connected
              to your account.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-primary-foreground/80">
            <div className="rounded-[8px] border border-white/15 bg-white/[0.08] p-4">
              Survey progress stays tied to your email.
            </div>
            <div className="rounded-[8px] border border-white/15 bg-white/[0.08] p-4">
              Results reopen cleanly when teams are published.
            </div>
            <div className="rounded-[8px] border border-white/15 bg-white/[0.08] p-4">
              Privacy settings travel with your student profile.
            </div>
          </div>
        </aside>
        <section className="flex items-center justify-center py-6 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md rounded-[8px] border border-border bg-card/95 p-6 shadow-[0_16px_42px_oklch(0.18_0_0_/_0.05)] sm:p-8"
          >
            <h1 className="font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 mb-6 text-sm leading-6 text-muted">{subtitle}</p>}
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </motion.div>
        </section>
      </main>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  let labelFor = htmlFor;
  let content = children;

  if (
    !labelFor &&
    React.isValidElement<{ id?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "textarea", "select"].includes(children.type)
  ) {
    labelFor = children.props.id ?? generatedId;
    content = React.cloneElement(children, { id: labelFor });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={labelFor} className="block text-xs sm:text-sm font-medium">
        {label}
      </label>
      {content}
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
