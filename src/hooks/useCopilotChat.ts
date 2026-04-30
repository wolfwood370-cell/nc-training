// =============================================================================
// src/hooks/useCopilotChat.ts
// =============================================================================
// PHASE 5.3 — Master Copilot client-side chat session manager.
//
// Responsibilities:
//   - Hold local message history (user / assistant turns).
//   - Optimistically append the user's message before the network round-trip
//     so the UI feels instant.
//   - Invoke the `ask-copilot` edge function via supabase.functions.invoke,
//     forwarding the prior history so the model has conversational context.
//   - Roll back the optimistic user turn if the request fails, surface a
//     toast, and expose `error` so the caller can render an inline retry.
//   - Abort any in-flight request when a new send arrives or the component
//     unmounts (no setState-after-unmount, no zombie responses overwriting
//     a newer answer).
//
// Intentionally NOT included:
//   - UI components (per the spec).
//   - React Query: this is an inherently sequential, stateful conversation
//     (each turn depends on the previous), not a cacheable resource. useState
//     + a ref-tracked AbortController is the right primitive.
//   - Persistence to disk/db: the spec says "local chat state". Add a
//     `messages_persistence` layer separately if/when needed.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------
export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotSource {
  chunk_id: string;
  document_id: string;
  document_title: string;
  similarity: number;
}

export interface UseCopilotChatResult {
  messages: CopilotMessage[];
  /** Most recent assistant turn's source citations, if any. */
  lastSources: CopilotSource[];
  isLoading: boolean;
  /** Last error message in Italian, ready to render. `null` when healthy. */
  error: string | null;
  /** Send a new user message. Resolves once the assistant turn is appended. */
  sendMessage: (text: string) => Promise<void>;
  /** Wipe the conversation (and any pending error). */
  reset: () => void;
}

// -----------------------------------------------------------------------------
// Tunables — kept loose enough for slow networks but tight enough that a
// genuinely hung request fails before the user gives up and reloads.
// -----------------------------------------------------------------------------
const REQUEST_TIMEOUT_MS = 60_000;

// =============================================================================
// useCopilotChat
// =============================================================================
export function useCopilotChat(): UseCopilotChatResult {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [lastSources, setLastSources] = useState<CopilotSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Track the in-flight request so a second send can cancel the first, and
  // unmount can cancel anything still pending. Without this, a fast double-tap
  // produces a race where the older response can clobber the newer one.
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setLastSources([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (isLoading) {
        // Avoid stacking requests. The UI should already be disabling the
        // input while loading, but defend in depth.
        return;
      }

      // Snapshot the history we'll send to the edge function. We send the
      // pre-optimistic state (the new user turn is sent as `message`, the
      // rest is `history`) so the function's prompt assembly stays clean.
      const historyForServer = messages;

      // Optimistic append.
      const optimisticUser: CopilotMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, optimisticUser]);
      setError(null);
      setIsLoading(true);

      // Cancel any prior in-flight call.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Independent timeout. supabase.functions.invoke does not natively take
      // a signal/timeout, but it does forward `signal` through fetch under
      // the hood — so this both bounds total wall-time AND lets us cancel on
      // unmount or on a follow-up send.
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke<{
          answer: string;
          sources?: CopilotSource[];
          error?: string;
        }>("ask-copilot", {
          body: {
            message: trimmed,
            history: historyForServer,
          },
          // @ts-expect-error — `signal` is supported by the underlying fetch
          // but not yet typed in @supabase/functions-js options.
          signal: controller.signal,
        });

        // If we were aborted (unmount / superseded), bail silently.
        if (controller.signal.aborted || !mountedRef.current) return;

        if (invokeError) {
          throw new Error(invokeError.message || "Errore di rete");
        }
        if (!data) {
          throw new Error("Risposta vuota dal server");
        }
        if (data.error) {
          // Edge function returned a structured error (rate limit, missing
          // config, etc.). Surface it verbatim — it's already in Italian.
          throw new Error(data.error);
        }
        if (!data.answer) {
          throw new Error("Il copilot non ha restituito una risposta.");
        }

        const assistantTurn: CopilotMessage = {
          role: "assistant",
          content: data.answer,
        };
        setMessages((prev) => [...prev, assistantTurn]);
        setLastSources(data.sources ?? []);
      } catch (e) {
        // Aborts are not user-facing errors.
        if (
          (e instanceof DOMException && e.name === "AbortError") ||
          controller.signal.aborted
        ) {
          return;
        }

        const message =
          e instanceof Error ? e.message : "Errore imprevisto durante la richiesta.";

        if (!mountedRef.current) return;

        // Roll back the optimistic user turn so the input the user typed
        // doesn't sit there pretending it was delivered. The UI can re-fill
        // the input from `lastFailedMessage` if it wants — but we keep the
        // hook surface minimal and let the caller hold draft state.
        setMessages((prev) => {
          // Only pop if the last entry is still our optimistic insert; defends
          // against weird interleaving.
          if (
            prev.length > 0 &&
            prev[prev.length - 1].role === "user" &&
            prev[prev.length - 1].content === trimmed
          ) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setError(message);
        toast({
          title: "Errore Copilot",
          description: message,
          variant: "destructive",
        });
      } finally {
        clearTimeout(timeoutId);
        if (mountedRef.current && abortRef.current === controller) {
          abortRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [isLoading, messages, toast],
  );

  return {
    messages,
    lastSources,
    isLoading,
    error,
    sendMessage,
    reset,
  };
}
