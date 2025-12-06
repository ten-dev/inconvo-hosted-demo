"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import type { PropsWithChildren } from "react";
import { AssistantSidebar } from "~/components/assistant-ui/assistant-sidebar";

export const Assistant = ({ children }: PropsWithChildren) => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantSidebar>{children}</AssistantSidebar>
    </AssistantRuntimeProvider>
  );
};
