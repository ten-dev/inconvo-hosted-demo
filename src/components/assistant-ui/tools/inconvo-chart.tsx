"use client";

import { useMemo, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Label,
  Legend,
} from "recharts";

import type { InconvoChartData, InconvoChartType } from "~/lib/inconvo/types";
import { buildChartPalette } from "~/components/assistant-ui/tools/inconvo-chart-colors";

interface InconvoChartProps {
  data: InconvoChartData;
  variant: InconvoChartType;
  xLabel?: string;
  yLabel?: string;
  title?: string;
}

const ChartScaffold = ({
  children,
  axisColor,
  textColor,
  xLabel,
  yLabel,
  labelCount,
}: {
  children: ReactNode;
  axisColor: string;
  textColor: string;
  xLabel?: string;
  yLabel?: string;
  labelCount: number;
}) => (
  <>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis
      dataKey="name"
      stroke={axisColor}
      tick={{ fill: axisColor, fontSize: 12 }}
      angle={-30}
      textAnchor="end"
      interval={labelCount > 12 ? "preserveStartEnd" : 0}
    >
      {xLabel ? (
        <Label
          position="bottom"
          offset={24}
          style={{
            fill: axisColor,
            textAnchor: "middle",
          }}
          value={xLabel}
        />
      ) : null}
    </XAxis>
    <YAxis width={80} stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }}>
      {yLabel ? (
        <Label
          angle={-90}
          position="insideLeft"
          style={{
            fill: axisColor,
            textAnchor: "middle",
          }}
          value={yLabel}
        />
      ) : null}
    </YAxis>
    <Tooltip
      contentStyle={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        color: textColor,
      }}
      labelStyle={{
        color: textColor,
        fontWeight: 600,
      }}
    />
    <Legend
      verticalAlign="top"
      align="right"
      wrapperStyle={{
        color: axisColor,
        paddingBottom: "4px",
      }}
    />
    {children}
  </>
);

export const InconvoChart = ({
  data,
  variant,
  xLabel,
  yLabel,
}: InconvoChartProps) => {
  const chartData = useMemo(() => {
    return data.labels.map((label, index) => {
      const row: { name: string; [key: string]: string | number } = {
        name: label,
      };
      data.datasets.forEach((dataset) => {
        row[dataset.name] = dataset.values[index] ?? 0;
      });
      return row;
    });
  }, [data]);

  const palette = useMemo(
    () => buildChartPalette(data.datasets.length),
    [data.datasets.length],
  );

  const axisColor = "var(--muted-foreground)";
  const textColor = "var(--foreground)";
  const margins = { top: 20, right: 30, bottom: xLabel ? 80 : 40, left: 20 };

  const renderLines = () =>
    data.datasets.map((dataset, index) => {
      const stroke = palette[index] ?? "var(--chart-series-primary)";
      return (
        <Line
          key={dataset.name}
          type="monotone"
          dataKey={dataset.name}
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 2, stroke, fill: "var(--card)" }}
          activeDot={{ r: 5, strokeWidth: 2, stroke, fill: stroke }}
        />
      );
    });

  const renderBars = () =>
    data.datasets.map((dataset, index) => (
      <Bar
        key={dataset.name}
        dataKey={dataset.name}
        fill={palette[index] ?? "var(--chart-series-primary)"}
        radius={[4, 4, 0, 0]}
        maxBarSize={48}
      />
    ));

  return (
    <div className="flex w-full flex-col gap-4 text-foreground">
      <ResponsiveContainer width="100%" height={400}>
        {variant === "line" ? (
          <RechartsLineChart data={chartData} margin={margins}>
            <ChartScaffold
              axisColor={axisColor}
              textColor={textColor}
              xLabel={xLabel}
              yLabel={yLabel}
              labelCount={data.labels.length}
            >
              {renderLines()}
            </ChartScaffold>
          </RechartsLineChart>
        ) : (
          <RechartsBarChart data={chartData} margin={margins}>
            <ChartScaffold
              axisColor={axisColor}
              textColor={textColor}
              xLabel={xLabel}
              yLabel={yLabel}
              labelCount={data.labels.length}
            >
              {renderBars()}
            </ChartScaffold>
          </RechartsBarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
