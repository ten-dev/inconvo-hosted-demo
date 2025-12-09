"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { FC, PropsWithChildren } from "react";
import { useMediaQuery } from "@mantine/hooks";

import { Thread } from "~/components/assistant-ui/thread";
import { MobileLayout } from "~/components/assistant-ui/mobile-layout";
import type { OrganisationSelectorProps } from "~/components/organisation/organisation-selector";

type AssistantSidebarProps = PropsWithChildren<{
  organisationSelectorProps?: OrganisationSelectorProps;
}>;

export const AssistantSidebar: FC<AssistantSidebarProps> = ({
  children,
  organisationSelectorProps,
}) => {
  const isMobile = useMediaQuery("(max-width: 639px)");

  if (isMobile) {
    return (
      <MobileLayout
        chatContent={
          <Thread organisationSelectorProps={organisationSelectorProps} />
        }
        dataContent={children}
      />
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={60}>{children}</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={40}>
        <Thread organisationSelectorProps={organisationSelectorProps} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
