"use client";

import { type PropsWithChildren } from "react";

import { AssistantSidebar } from "~/components/assistant-ui/assistant-sidebar";
import type { OrganisationSelectorProps } from "~/components/organisation/organisation-selector";
import { InconvoRuntimeProvider } from "./InconvoRuntimeProvider";

type AssistantProps = PropsWithChildren<{
  organisationId: number | null;
  organisationSelectorProps: OrganisationSelectorProps;
}>;

export const Assistant = ({
  children,
  organisationId,
  organisationSelectorProps,
}: AssistantProps) => {
  return (
    <InconvoRuntimeProvider organisationId={organisationId}>
      <AssistantSidebar organisationSelectorProps={organisationSelectorProps}>
        {children}
      </AssistantSidebar>
    </InconvoRuntimeProvider>
  );
};
