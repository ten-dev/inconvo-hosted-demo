"use client";

import {
  TextMessagePartProvider,
  useMessagePartText,
  type TextMessagePartComponent,
} from "@assistant-ui/react";
import { useMemo, type ReactNode } from "react";

import { MarkdownText } from "~/components/assistant-ui/markdown-text";
import { InconvoChart } from "~/components/assistant-ui/tools/inconvo-chart";
import { DataTable } from "~/components/assistant-ui/tools/inconvo-data-table";
import { parseInconvoResponse } from "~/lib/inconvo/types";

export const InconvoTextMessage: TextMessagePartComponent = () => {
  const { text, status } = useMessagePartText();
  const parsed = useMemo(() => parseInconvoResponse(text), [text]);

  if (!parsed) {
    return <MarkdownText />;
  }

  if (parsed.type === "chart") {
    if (!parsed.chart) {
      return (
        <ResponseCard>
          <ResponseTitle title="Chart data unavailable" />
          <ResponseBody>
            Unable to display the chart payload returned by the assistant.
          </ResponseBody>
        </ResponseCard>
      );
    }

    return (
      <ResponseCard>
        <ResponseTitle title={parsed.chart.title ?? "Chart"} />
        {parsed.message ? <ResponseBody>{parsed.message}</ResponseBody> : null}
        <InconvoChart spec={parsed.chart.spec} />
      </ResponseCard>
    );
  }

  if (parsed.type === "table") {
    if (!parsed.table) {
      return (
        <ResponseCard>
          <ResponseTitle title="Table data unavailable" />
          <ResponseBody>
            The assistant referenced a table but no data was provided.
          </ResponseBody>
        </ResponseCard>
      );
    }

    return (
      <ResponseCard>
        <ResponseTitle title="Tabular result" />
        {parsed.message ? <ResponseBody>{parsed.message}</ResponseBody> : null}
        <DataTable head={parsed.table.head} body={parsed.table.body} />
      </ResponseCard>
    );
  }

  const renderedText = parsed.message ?? text;
  return (
    <TextMessagePartProvider
      text={renderedText}
      isRunning={status.type === "running"}
    >
      <MarkdownText />
    </TextMessagePartProvider>
  );
};

const ResponseCard = ({ children }: { children: ReactNode }) => (
  <div className="aui-inconvo-card mb-4 flex w-full flex-col gap-4 rounded-2xl border border-border bg-muted/50 px-5 py-4 text-sm dark:bg-muted/20">
    {children}
  </div>
);

const ResponseTitle = ({ title }: { title: string }) => (
  <p className="font-semibold text-foreground">{title}</p>
);

const ResponseBody = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);
