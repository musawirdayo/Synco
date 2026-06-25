import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

const defaultOptions: ConfirmOptions = {
  title: "Are you sure?",
  description: "Please confirm before continuing.",
  confirmLabel: "Continue",
  cancelLabel: "Cancel",
};

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>(defaultOptions);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const finish = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions({ ...defaultOptions, ...nextOptions });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const confirmationDialog = useMemo(
    () => (
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) finish(false);
          else setOpen(true);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finish(false)}>
              {options.cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finish(true)}
              className={
                options.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {options.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [finish, open, options],
  );

  return { confirm, confirmationDialog };
}
