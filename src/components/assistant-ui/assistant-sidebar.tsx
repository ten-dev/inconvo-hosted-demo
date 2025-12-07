import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { FC, PropsWithChildren } from "react";

import { Thread } from "~/components/assistant-ui/thread";
import type { OrganisationSelectorProps } from "~/components/organisation/organisation-selector";

type AssistantSidebarProps = PropsWithChildren<{
  organisationSelectorProps?: OrganisationSelectorProps;
}>;

export const AssistantSidebar: FC<AssistantSidebarProps> = ({
  children,
  organisationSelectorProps,
}) => {
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
