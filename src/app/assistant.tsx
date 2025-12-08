"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useMemo, type PropsWithChildren } from "react";
import { AssistantSidebar } from "~/components/assistant-ui/assistant-sidebar";
import type { OrganisationSelectorProps } from "~/components/organisation/organisation-selector";

type AssistantProps = PropsWithChildren<{
  organisationId: number | null;
  organisationSelectorProps: OrganisationSelectorProps;
}>;

export const Assistant = ({
  children,
  organisationId,
  organisationSelectorProps,
}: AssistantProps) => {
  const transport = useMemo(() => {
    const scopedOrganisationId =
      typeof organisationId === "number" && Number.isFinite(organisationId)
        ? Math.trunc(organisationId)
        : null;

    return new AssistantChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: (options) => {
        const baseBody: Record<string, unknown> = options.body ?? {};
        const existingUserContext =
          typeof baseBody.userContext === "object" && baseBody.userContext !== null
            ? (baseBody.userContext as Record<string, unknown>)
            : {};

        const bodyWithContext =
          scopedOrganisationId === null
            ? baseBody
            : {
                ...baseBody,
                userContext: {
                  ...existingUserContext,
                  organisationId: scopedOrganisationId,
                },
              };

        return {
          body: {
            ...bodyWithContext,
            id: options.id,
            messages: options.messages,
            trigger: options.trigger,
            messageId: options.messageId,
            metadata: options.requestMetadata,
          },
        };
      },
    });
  }, [organisationId]);

  const runtime = useChatRuntime({
    transport,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantSidebar organisationSelectorProps={organisationSelectorProps}>
        {children}
      </AssistantSidebar>
    </AssistantRuntimeProvider>
  );
};
