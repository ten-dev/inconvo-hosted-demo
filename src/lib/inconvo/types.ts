export type InconvoChartType = "bar" | "line";

export interface InconvoChartDataset {
  name: string;
  values: number[];
}

export interface InconvoChartData {
  labels: string[];
  datasets: InconvoChartDataset[];
}

export interface InconvoChart {
  data: InconvoChartData;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  type: InconvoChartType;
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

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
};

const isNumberArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
};

const isDataset = (value: unknown): value is InconvoChartDataset => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as InconvoChartDataset).name === "string" &&
    isNumberArray((value as InconvoChartDataset).values)
  );
};

const isChartData = (value: unknown): value is InconvoChartData => {
  return (
    typeof value === "object" &&
    value !== null &&
    isStringArray((value as InconvoChartData).labels) &&
    Array.isArray((value as InconvoChartData).datasets) &&
    (value as InconvoChartData).datasets.every(isDataset)
  );
};

const isChart = (value: unknown): value is InconvoChart => {
  return (
    typeof value === "object" &&
    value !== null &&
    ((value as InconvoChart).type === "bar" || (value as InconvoChart).type === "line") &&
    isChartData((value as InconvoChart).data)
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

  if (candidate.type !== "text" && candidate.type !== "chart" && candidate.type !== "table") {
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
  value: unknown,
): InconvoResponse | null => {
  try {
    const parsed: unknown =
      typeof value === "string" ? JSON.parse(value) : value;
    return isInconvoResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
