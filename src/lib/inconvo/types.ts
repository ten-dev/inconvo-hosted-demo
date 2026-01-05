import type { VisualizationSpec } from "vega-embed";

export type InconvoChartType = "bar" | "line";

export type InconvoChartSpec = VisualizationSpec;

export interface InconvoChart {
  spec: InconvoChartSpec;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  type?: InconvoChartType;
}

export interface InconvoTable {
  head: string[];
  body: string[][];
}

export type InconvoResponseType = "text" | "chart" | "table";

export interface InconvoResponse {
  id?: string;
  conversationId?: string;
  message: string;
  type: InconvoResponseType;
  chart?: InconvoChart;
  table?: InconvoTable;
}

const isChart = (value: unknown): value is InconvoChart => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const chart = value as InconvoChart;
  const hasValidType =
    chart.type === undefined || chart.type === "bar" || chart.type === "line";
  const hasSpec = chart.spec && typeof chart.spec === "object";

  return hasValidType && !!hasSpec;
};

const isStringArray = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
};

const isTable = (value: unknown): value is InconvoTable => {
  return (
    typeof value === "object" &&
    value !== null &&
    isStringArray((value as InconvoTable).head) &&
    Array.isArray((value as InconvoTable).body) &&
    (value as InconvoTable).body.every(isStringArray)
  );
};

const isInconvoResponse = (value: unknown): value is InconvoResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as InconvoResponse;
  if (typeof candidate.message !== "string") {
    return false;
  }

  if (
    candidate.type !== "text" &&
    candidate.type !== "chart" &&
    candidate.type !== "table"
  ) {
    return false;
  }

  if (candidate.type === "chart" && !isChart(candidate.chart)) {
    return false;
  }

  if (candidate.type === "table" && !isTable(candidate.table)) {
    return false;
  }

  return true;
};

export const parseInconvoResponse = (
  value: unknown
): InconvoResponse | null => {
  try {
    const parsed: unknown =
      typeof value === "string" ? JSON.parse(value) : value;

    if (typeof parsed === "object" && parsed !== null) {
      const candidate = parsed as Record<string, unknown>;

      // Accept top-level spec payloads for charts by wrapping them in a chart object.
      if (
        candidate.type === "chart" &&
        !candidate.chart &&
        candidate.spec &&
        typeof candidate.spec === "object"
      ) {
        const spec = candidate.spec as VisualizationSpec;
        const title =
          typeof candidate.title === "string" ? candidate.title : undefined;
        const xLabel =
          typeof candidate.xLabel === "string" ? candidate.xLabel : undefined;
        const yLabel =
          typeof candidate.yLabel === "string" ? candidate.yLabel : undefined;
        const chartType =
          candidate.chartType === "bar" || candidate.chartType === "line"
            ? candidate.chartType
            : undefined;

        candidate.chart = {
          spec,
          title,
          xLabel,
          yLabel,
          type: chartType,
        } satisfies Partial<InconvoChart>;
      }
    }

    return isInconvoResponse(parsed) ? (parsed as InconvoResponse) : null;
  } catch {
    return null;
  }
};
