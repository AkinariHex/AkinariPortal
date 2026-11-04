"use client";

import { useCallback, useTransition } from "react";
import { toastResult } from "./toastResult";

type Result = { status: string; message?: string };

// Runs a server action in a transition and toasts its result.
// `run` resolves to the result (or null if the call itself threw).
export function useServerAction() {
  const [pending, startTransition] = useTransition();
  const run = useCallback(
    <R extends Result>(action: () => Promise<R>, success: string) =>
      new Promise<R | null>((resolve) => {
        startTransition(async () => {
          try {
            const res = await action();
            toastResult(res, success);
            resolve(res);
          } catch {
            toastResult({ status: "error" }, success);
            resolve(null);
          }
        });
      }),
    []
  );
  return { pending, run };
}
