import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        <div className="text-left bg-destructive/5 border border-destructive/20 rounded-lg p-4 font-mono text-xs overflow-auto max-h-72 max-w-xl mx-auto space-y-2">
          <p className="font-semibold text-destructive">{error.message || String(error)}</p>
          {error.stack && (
            <pre className="text-muted-foreground whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Synco — Find the classmates you work best with" },
      {
        name: "description",
        content:
          "Private class collaboration tool. Better groups through honest answers, not guesswork.",
      },
      { property: "og:title", content: "Synco — Find the classmates you work best with" },
      {
        property: "og:description",
        content:
          "Private class collaboration tool. Better groups through honest answers, not guesswork.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Synco — Find the classmates you work best with" },
      {
        name: "twitter:description",
        content:
          "Private class collaboration tool. Better groups through honest answers, not guesswork.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e1f1c5c-4aff-4086-88ea-7eb5d941c7a0/id-preview-7f9c2230--c4b9d942-388c-4f68-8988-eac93f0fc650.lovable.app-1779575169577.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e1f1c5c-4aff-4086-88ea-7eb5d941c7a0/id-preview-7f9c2230--c4b9d942-388c-4f68-8988-eac93f0fc650.lovable.app-1779575169577.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const prefersReducedMotion = useReducedMotion();

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </QueryClientProvider>
  );
}
