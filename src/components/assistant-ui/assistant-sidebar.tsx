import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { FC, PropsWithChildren } from "react";

import { Thread } from "~/components/assistant-ui/thread";

export const AssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={60}>{children}</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={40}>
        <Thread />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
