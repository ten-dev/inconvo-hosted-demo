const chartColorVars = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const buildChartPalette = (seriesCount: number) => {
  if (seriesCount <= 0) return [];
  return Array.from({ length: seriesCount }, (_, index) => {
    const colorIndex = index % chartColorVars.length;
    return chartColorVars[colorIndex] ?? "var(--chart-series-primary)";
  });
};
