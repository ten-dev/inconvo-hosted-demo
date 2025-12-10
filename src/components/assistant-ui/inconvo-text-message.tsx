"use client";

import {
  TextMessagePartProvider,
  useMessagePartText,
  type TextMessagePartComponent,
} from "@assistant-ui/react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import posthog from "posthog-js";

import { MarkdownText } from "~/components/assistant-ui/markdown-text";
import { InconvoChart } from "~/components/assistant-ui/tools/inconvo-chart";
import { DataTable } from "~/components/assistant-ui/tools/inconvo-data-table";
import { parseInconvoResponse } from "~/lib/inconvo/types";
import { cn } from "~/lib/utils";

export const InconvoTextMessage: TextMessagePartComponent = () => {
  const { text, status } = useMessagePartText();
  const parsed = useMemo(() => parseInconvoResponse(text), [text]);
  const trackedRef = useRef<string | null>(null);
  const isStreaming = status.type === "running";

  // Track chart or table rendering only once per unique response
  useEffect(() => {
    if (status.type === "running" || !parsed) return;

    const trackingKey = `${parsed.type}-${text.slice(0, 100)}`;
    if (trackedRef.current === trackingKey) return;

    if (parsed.type === "chart" && parsed.chart) {
      posthog.capture("chart_rendered", {
        chart_type: parsed.chart.type,
        chart_title: parsed.chart.title,
      });
      trackedRef.current = trackingKey;
    } else if (parsed.type === "table" && parsed.table) {
      posthog.capture("table_rendered", {
        column_count: parsed.table.head?.length ?? 0,
        row_count: parsed.table.body?.length ?? 0,
      });
      trackedRef.current = trackingKey;
    }
  }, [parsed, status.type, text]);

  const streamingClasses = isStreaming ? "aui-streaming-message" : "";

  if (!parsed) {
    return (
      <div className={cn(streamingClasses)}>
        <MarkdownText />
      </div>
    );
  }

  if (parsed.type === "chart") {
    if (!parsed.chart) {
      return (
        <ResponseCard className={streamingClasses}>
          <ResponseTitle title="Chart data unavailable" />
          <ResponseBody>
            Unable to display the chart payload returned by the assistant.
          </ResponseBody>
        </ResponseCard>
      );
    }

    return (
      <ResponseCard className={streamingClasses}>
        <ResponseTitle title={parsed.chart.title ?? "Chart"} />
        {parsed.message ? <ResponseBody>{parsed.message}</ResponseBody> : null}
        <InconvoChart
          data={parsed.chart.data}
          variant={parsed.chart.type}
          title={parsed.chart.title}
          xLabel={parsed.chart.xLabel}
          yLabel={parsed.chart.yLabel}
        />
      </ResponseCard>
    );
  }

  if (parsed.type === "table") {
    if (!parsed.table) {
      return (
        <ResponseCard className={streamingClasses}>
          <ResponseTitle title="Table data unavailable" />
          <ResponseBody>
            The assistant referenced a table but no data was provided.
          </ResponseBody>
        </ResponseCard>
      );
    }

    return (
      <ResponseCard className={streamingClasses}>
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
      <div className={cn(streamingClasses)}>
        <MarkdownText />
      </div>
    </TextMessagePartProvider>
  );
};

const ResponseCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "aui-inconvo-card mb-4 flex w-full flex-col gap-4 rounded-2xl border border-border bg-muted/50 px-5 py-4 text-sm dark:bg-muted/20",
      className
    )}
  >
    {children}
  </div>
);

const ResponseTitle = ({ title }: { title: string }) => (
  <p className="font-semibold text-foreground">{title}</p>
);

const ResponseBody = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);
