"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import {
  makeAssistantToolUI,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";
import type { ReactNode } from "react";

import { InconvoChart } from "~/components/assistant-ui/tools/inconvo-chart";
import { DataTable } from "~/components/assistant-ui/tools/inconvo-data-table";
import {
  type InconvoResponse,
  parseInconvoResponse,
} from "~/lib/inconvo/types";

interface MessageDataAnalystArgs {
  conversationId: string;
  message: string;
}

type MessageDataAnalystResult = string | InconvoResponse;

const MessageDataAnalystToolRender: ToolCallMessagePartComponent<
  MessageDataAnalystArgs,
  MessageDataAnalystResult
> = ({ result, status }) => {
  if (status?.type === "running" || !result) {
    return (
      <ToolCard>
        <ToolCardHeader
          title="Contacting data analyst"
          description="Waiting for the data analyst to send a reply..."
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Fetching details</span>
        </div>
      </ToolCard>
    );
  }

  const parsed = parseInconvoResponse(result);

  if (!parsed) {
    return (
      <ToolCard variant="error">
        <ToolCardHeader
          variant="error"
          title="Unable to read analyst response"
          description="The response couldn't be parsed. Showing the raw payload below."
        />
        <RawPayload
          payload={
            typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2)
          }
        />
      </ToolCard>
    );
  }

  if (status?.type === "incomplete") {
    return (
      <ToolCard variant="error">
        <ToolCardHeader
          variant="error"
          title="Analyst conversation interrupted"
          description={
            status.reason === "cancelled"
              ? "The tool call was cancelled before it completed."
              : "The tool call ended unexpectedly."
          }
        />
        <RawPayload payload={parsed.message} />
      </ToolCard>
    );
  }

  switch (parsed.type) {
    case "text":
      return (
        <ToolCard>
          <ToolCardHeader
            title="Analyst response"
            description="Plain text answer from the analyst"
          />
          <TextResponse content={parsed.message} />
        </ToolCard>
      );
    case "chart":
      if (!parsed.chart) {
        return (
          <ToolCard variant="error">
            <ToolCardHeader
              variant="error"
              title="Missing chart payload"
              description="The analyst referenced a chart but no data was provided."
            />
          </ToolCard>
        );
      }
      return (
        <ToolCard>
          <ToolCardHeader
            title={parsed.chart.title ?? "Chart"}
            description={parsed.message}
          />
          <InconvoChart spec={parsed.chart.spec} />
        </ToolCard>
      );
    case "table":
      if (!parsed.table) {
        return (
          <ToolCard variant="error">
            <ToolCardHeader
              variant="error"
              title="Missing table payload"
              description="The analyst referenced a table but no data was provided."
            />
          </ToolCard>
        );
      }
      return (
        <ToolCard>
          <ToolCardHeader title="Tabular result" description={parsed.message} />
          <DataTable head={parsed.table.head} body={parsed.table.body} />
        </ToolCard>
      );
    default:
      return (
        <ToolCard>
          <ToolCardHeader
            title="Analyst response"
            description="Response received, but no renderer is configured for this type yet."
          />
          <RawPayload payload={JSON.stringify(parsed, null, 2)} />
        </ToolCard>
      );
  }
};

export const MessageDataAnalystTool = makeAssistantToolUI<
  MessageDataAnalystArgs,
  MessageDataAnalystResult
>({
  toolName: "message_data_analyst",
  render: MessageDataAnalystToolRender,
});

const ToolCard = ({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "error";
}) => {
  const borderClasses =
    variant === "error"
      ? "border-red-500/40 bg-red-500/5 dark:bg-red-500/10"
      : "border-border bg-muted/50 dark:bg-muted/20";

  return (
    <div
      className={`aui-tool-card mb-4 flex w-full flex-col gap-4 rounded-2xl border px-5 py-4 text-sm ${borderClasses}`}
    >
      {children}
    </div>
  );
};

const ToolCardHeader = ({
  title,
  description,
  variant = "default",
}: {
  title: string;
  description?: string;
  variant?: "default" | "error";
}) => (
  <div className="flex gap-2">
    {variant === "error" ? (
      <AlertCircle className="mt-0.5 size-4 text-red-500" />
    ) : null}
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  </div>
);

const TextResponse = ({ content }: { content: string }) => (
  <p className="whitespace-pre-wrap text-base leading-6 text-foreground">
    {content}
  </p>
);

const RawPayload = ({ payload }: { payload: string }) => (
  <pre className="overflow-auto rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
    {payload}
  </pre>
);
