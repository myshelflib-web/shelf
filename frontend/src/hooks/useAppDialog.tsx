"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AppDialog,
  type AlertDialogOptions,
  type AppDialogRequest,
  type ConfirmDialogOptions,
  type PromptDialogOptions,
} from "@/components/AppDialog";

type Pending =
  | {
      mode: "confirm";
      options: ConfirmDialogOptions;
      resolve: (value: boolean) => void;
    }
  | {
      mode: "alert";
      options: AlertDialogOptions;
      resolve: () => void;
    }
  | {
      mode: "prompt";
      options: PromptDialogOptions;
      resolve: (value: string | null) => void;
    };

interface AppDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  alert: (options: AlertDialogOptions) => Promise<void>;
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

function toRequest(item: Pending): AppDialogRequest {
  if (item.mode === "confirm") {
    return { mode: "confirm", ...item.options };
  }
  if (item.mode === "alert") {
    return { mode: "alert", ...item.options };
  }
  return { mode: "prompt", ...item.options };
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Pending | null>(null);
  const currentRef = useRef<Pending | null>(null);
  const queueRef = useRef<Pending[]>([]);

  const showNext = useCallback((next: Pending | null) => {
    currentRef.current = next;
    setCurrent(next);
  }, []);

  const enqueue = useCallback(
    (item: Pending) => {
      if (currentRef.current) {
        queueRef.current.push(item);
        return;
      }
      showNext(item);
    },
    [showNext]
  );

  const finish = useCallback(() => {
    const queued = queueRef.current.shift() ?? null;
    showNext(queued);
  }, [showNext]);

  const confirm = useCallback(
    (options: ConfirmDialogOptions) =>
      new Promise<boolean>((resolve) => {
        enqueue({ mode: "confirm", options, resolve });
      }),
    [enqueue]
  );

  const alert = useCallback(
    (options: AlertDialogOptions) =>
      new Promise<void>((resolve) => {
        enqueue({ mode: "alert", options, resolve });
      }),
    [enqueue]
  );

  const prompt = useCallback(
    (options: PromptDialogOptions) =>
      new Promise<string | null>((resolve) => {
        enqueue({ mode: "prompt", options, resolve });
      }),
    [enqueue]
  );

  const onConfirm = useCallback(
    (value?: string) => {
      const item = currentRef.current;
      if (!item) return;
      if (item.mode === "prompt") item.resolve(value ?? null);
      else if (item.mode === "confirm") item.resolve(true);
      else item.resolve();
      finish();
    },
    [finish]
  );

  const onCancel = useCallback(() => {
    const item = currentRef.current;
    if (!item) return;
    if (item.mode === "prompt") item.resolve(null);
    else if (item.mode === "confirm") item.resolve(false);
    else item.resolve();
    finish();
  }, [finish]);

  const value = useMemo(
    () => ({ confirm, alert, prompt }),
    [confirm, alert, prompt]
  );

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      {current ? (
        <AppDialog
          request={toRequest(current)}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
}
