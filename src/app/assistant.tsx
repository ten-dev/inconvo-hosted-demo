"use client";

import { type PropsWithChildren, useMemo } from "react";
import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";

import { AssistantSidebar } from "~/components/assistant-ui/assistant-sidebar";
import type { OrganisationSelectorProps } from "~/components/organisation/organisation-selector";
import { InconvoRuntimeProvider, useInconvoState } from "./InconvoRuntimeProvider";

type AssistantProps = PropsWithChildren<{
  organisationId: number | null;
  organisationSelectorProps: OrganisationSelectorProps;
}>;

function AssistantContent({
  children,
  organisationSelectorProps,
}: PropsWithChildren<{
  organisationSelectorProps: OrganisationSelectorProps;
}>) {
  const { hasMessages } = useInconvoState();

  const wrappedOrgSelectorProps: OrganisationSelectorProps = useMemo(() => {
    const originalOnChange = organisationSelectorProps.onChange;

    return {
      ...organisationSelectorProps,
      onChange: (value: number | null) => {
        // If value is the same, no need to check
        if (value === organisationSelectorProps.value) {
          originalOnChange(value);
          return;
        }

        // Show warning if there are messages in the thread
        if (hasMessages) {
          modals.openConfirmModal({
            title: "Switch Organization",
            children: (
              <Text size="sm">
                Switching organizations will clear the current conversation and
                all messages in this thread. Are you sure you want to continue?
              </Text>
            ),
            labels: { confirm: "Switch Organization", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: () => {
              originalOnChange(value);
            },
          });
          return;
        }

        // No messages, proceed with switching
        originalOnChange(value);
      },
    };
  }, [organisationSelectorProps, hasMessages]);

  return (
    <AssistantSidebar organisationSelectorProps={wrappedOrgSelectorProps}>
      {children}
    </AssistantSidebar>
  );
}

export const Assistant = ({
  children,
  organisationId,
  organisationSelectorProps,
}: AssistantProps) => {
  return (
    <InconvoRuntimeProvider organisationId={organisationId}>
      <AssistantContent organisationSelectorProps={organisationSelectorProps}>
        {children}
      </AssistantContent>
    </InconvoRuntimeProvider>
  );
};
