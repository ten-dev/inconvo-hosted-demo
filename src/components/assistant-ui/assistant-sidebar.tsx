"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { FC, PropsWithChildren } from "react";

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
  // Use CSS-only responsive design to avoid hydration mismatches
  // Mobile: shows only the chat thread in MobileLayout
  // Desktop: shows resizable panels with children + chat thread
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
};
