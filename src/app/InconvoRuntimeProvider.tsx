"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ExternalStoreAdapter,
} from "@assistant-ui/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ConversationCreateResponse,
  ResponseCreateResponse,
} from "@inconvoai/node/resources/conversations";
import type { ResponseStreamEvent } from "@inconvoai/node";

type ResponseCreateResponseOptionalId = Omit<
  ResponseCreateResponse,
  "id" | "conversationId"
> & {
  id?: string;
  conversationId?: string;
};

type InconvoMessage = {
  id: string;
  role: "user" | "assistant";
  content: ResponseCreateResponseOptionalId;
};

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const InconvoStateContext = createContext<{
  isLoading: boolean;
  conversationId: string | null;
}>({
  isLoading: false,
  conversationId: null,
});

export const useInconvoState = () => useContext(InconvoStateContext);

const extractTextContent = (message: AppendMessage): string => {
  const textPart = message.content.find(
    (part): part is { type: "text"; text: string } =>
      part.type === "text" && typeof part.text === "string",
  );
  return textPart?.text?.trim() ?? "";
};

const toScopedOrganisationId = (value: number | null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  return null;
};

type InconvoRuntimeProviderProps = {
  children: React.ReactNode;
  organisationId: number | null;
};

export function InconvoRuntimeProvider({
  children,
  organisationId,
}: InconvoRuntimeProviderProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessageState] = useState<InconvoMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scopedOrganisationId = useMemo(
    () => toScopedOrganisationId(organisationId),
    [organisationId],
  );

  const clearConversation = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    conversationIdRef.current = null;
    setConversationId(null);
    setMessageState([]);
    setIsRunning(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    clearConversation();
  }, [scopedOrganisationId, clearConversation]);

  const createConversationIfNeeded = useCallback(async () => {
    if (conversationIdRef.current) {
      return conversationIdRef.current;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/inconvo/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: scopedOrganisationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = (await response.json()) as ConversationCreateResponse;
      if (!data?.id) {
        throw new Error("Invalid conversation response");
      }

      conversationIdRef.current = data.id;
      setConversationId(data.id);
      return data.id;
    } finally {
      setIsLoading(false);
    }
  }, [scopedOrganisationId]);

  const streamResponse = useCallback(
    async (message: string, assistantMessageId: string) => {
      const scopedConversationId = conversationIdRef.current;
      if (!scopedConversationId) {
        throw new Error("Conversation not initialized");
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch("/api/inconvo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: scopedConversationId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Inconvo response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response stream unavailable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: ResponseStreamEvent;
            try {
              event = JSON.parse(line) as ResponseStreamEvent;
            } catch (error) {
              console.error("Unable to parse Inconvo event:", error);
              continue;
            }

            if (event.type === "response.progress" && event.message) {
              setMessageState((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: { type: "text", message: event.message },
                      }
                    : msg,
                ),
              );
            } else if (event.type === "response.completed") {
              const nextConversationId =
                event.response.conversationId ?? conversationIdRef.current;
              if (nextConversationId) {
                conversationIdRef.current = nextConversationId;
                setConversationId(nextConversationId);
              }
              setMessageState((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        id: event.response.id ?? msg.id,
                        content: event.response,
                      }
                    : msg,
                ),
              );
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = extractTextContent(message);
      if (!text) {
        return;
      }

      setIsRunning(true);

      try {
        await createConversationIfNeeded();
      } catch (error) {
        console.error("Unable to prepare conversation:", error);
        setIsRunning(false);
        return;
      }

      const userMessage: InconvoMessage = {
        id: generateId(),
        role: "user",
        content: {
          type: "text",
          message: text,
        },
      };

      const assistantMessage: InconvoMessage = {
        id: generateId(),
        role: "assistant",
        content: {
          type: "text",
          message: "Thinking...",
        },
      };

      setMessageState((prev) => [...prev, userMessage, assistantMessage]);

      try {
        await streamResponse(text, assistantMessage.id);
      } catch (error) {
        console.error("Inconvo streaming error:", error);
        setMessageState((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: {
                    type: "text",
                    message:
                      "Sorry, something went wrong while fetching the response.",
                  },
                }
              : msg,
          ),
        );
      } finally {
        setIsRunning(false);
      }
    },
    [createConversationIfNeeded, streamResponse],
  );

  const onCancel = useCallback(async () => {
    if (!abortControllerRef.current) return;
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setIsRunning(false);
  }, []);

  const applyMessages = useCallback(
    (nextMessages: readonly InconvoMessage[]) => {
      setMessageState([...nextMessages]);
    },
    [],
  );

  const adapter: ExternalStoreAdapter<InconvoMessage> = {
    isRunning,
    isLoading,
    messages,
    setMessages: applyMessages,
    convertMessage: (message) => {
      const textPayload =
        message.role === "user"
          ? message.content?.type === "text" &&
              typeof message.content.message === "string"
            ? message.content.message
            : JSON.stringify(message.content)
          : JSON.stringify(message.content);

      return {
        id: message.id,
        role: message.role,
        content: [
          {
            type: "text" as const,
            text: textPayload,
          },
        ],
      };
    },
    onNew,
    onEdit: onNew,
    onCancel,
  };

  const runtime = useExternalStoreRuntime(adapter);

  return (
    <InconvoStateContext.Provider
      value={{
        isLoading,
        conversationId,
      }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </InconvoStateContext.Provider>
  );
}
