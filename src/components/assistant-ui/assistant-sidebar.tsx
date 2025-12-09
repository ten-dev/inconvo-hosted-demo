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

  // During SSR and initial hydration, isMobile is undefined
  // Render both layouts and use CSS to show/hide based on screen size
  if (isMobile === undefined) {
    return (
      <>
        {/* Mobile layout - hidden on sm and up */}
        <div className="block h-full sm:hidden">
          <MobileLayout
            chatContent={
              <Thread organisationSelectorProps={organisationSelectorProps} />
            }
          />
        </div>
        {/* Desktop layout - hidden below sm */}
        <div className="hidden h-full sm:block">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={60}>{children}</ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={40}>
              <Thread organisationSelectorProps={organisationSelectorProps} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </>
    );
  }

  if (isMobile) {
    return (
      <MobileLayout
        chatContent={
          <Thread organisationSelectorProps={organisationSelectorProps} />
        }
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
