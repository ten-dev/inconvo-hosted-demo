"use client";

import { MessageDataAnalystTool } from "~/components/assistant-ui/tools/message-data-analyst-tool";
import {
  GetDataSummaryTool,
  StartDataAnalystConversationTool,
} from "~/components/assistant-ui/tools/inconvo-hidden-tools";

export const InconvoTools = () => {
  return (
    <>
      <MessageDataAnalystTool />
      <GetDataSummaryTool />
      <StartDataAnalystConversationTool />
    </>
  );
};
