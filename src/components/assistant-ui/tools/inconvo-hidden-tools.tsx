"use client";

import {
  makeAssistantToolUI,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";

type GenericArgs = Record<string, unknown>;
type GenericResult = unknown;

const HiddenToolRender: ToolCallMessagePartComponent<
  GenericArgs,
  GenericResult
> = () => null;

export const GetDataSummaryTool = makeAssistantToolUI<
  GenericArgs,
  GenericResult
>({
  toolName: "get_data_summary",
  render: HiddenToolRender,
});

export const StartDataAnalystConversationTool = makeAssistantToolUI<
  GenericArgs,
  GenericResult
>({
  toolName: "start_data_analyst_conversation",
  render: HiddenToolRender,
});
