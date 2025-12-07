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
        if (scopedOrganisationId === null) {
          return;
        }

        options.body = {
          ...(options.body ?? {}),
          userContext: {
            organisationId: scopedOrganisationId,
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
