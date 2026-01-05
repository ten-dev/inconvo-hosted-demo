"use client";

import { useEffect, useMemo, useState } from "react";
import { VegaEmbed } from "react-vega";
import type { VisualizationSpec } from "vega-embed";

import type { InconvoChartSpec } from "~/lib/inconvo/types";

interface InconvoChartProps {
  spec?: InconvoChartSpec;
  theme?: "light" | "dark";
}

type ChartConfig = NonNullable<VisualizationSpec["config"]>;
type ThemeMode = "light" | "dark";

const FALLBACK_LIGHT_COLORS = {
  foreground: "#000000",
  subtle: "#000000",
  border: "#000000",
  grid: "#f1f5f9",
} as const;

const FALLBACK_DARK_COLORS = {
  foreground: "#f3f4f6",
  subtle: "#e5e7eb",
  border: "#475569",
  grid: "#1f2937",
} as const;

export const InconvoChart = ({
  spec: providedSpec,
  theme,
}: InconvoChartProps) => {
  const [error, setError] = useState<string | null>(null);

  const [activeTheme, setActiveTheme] = useState<ThemeMode>(() => {
    if (theme) return theme;
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  });

  // Keep theme in sync with user-provided prop or document theme.
  useEffect(() => {
    const fromDocument = (): ThemeMode => {
      if (typeof document === "undefined") return "light";
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    };

    // If caller provides a theme, honor it; otherwise infer.
    const resolveTheme = (): ThemeMode => {
      return theme ?? fromDocument();
    };

    setActiveTheme(resolveTheme());

    if (theme) {
      // Caller is in charge of updates when providing theme.
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some(
        (m) => m.type === "attributes" && m.attributeName === "class"
      );
      if (shouldUpdate) {
        setActiveTheme(resolveTheme());
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  const themeConfig = useMemo<ChartConfig>(() => {
    const isDark = activeTheme === "dark";
    const palette = isDark ? FALLBACK_DARK_COLORS : FALLBACK_LIGHT_COLORS;

    return {
      axis: {
        labelColor: palette.foreground,
        titleColor: palette.subtle,
        domainColor: palette.border,
        tickColor: palette.border,
        gridColor: palette.grid,
      },
      legend: {
        labelColor: palette.foreground,
        titleColor: palette.subtle,
      },
      title: {
        color: palette.subtle,
      },
      view: {
        stroke: "transparent",
      },
    };
  }, [activeTheme]);

  const resolvedSpec = useMemo<VisualizationSpec | null>(() => {
    if (providedSpec) {
      const userConfig = (providedSpec.config ?? {}) as NonNullable<
        VisualizationSpec["config"]
      >;

      return {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        background: "transparent",
        autosize: { type: "fit", contains: "padding" },
        width: "container",
        ...providedSpec,
        config: {
          ...themeConfig,
          ...userConfig,
          axis: { ...themeConfig.axis, ...(userConfig.axis ?? {}) },
          legend: { ...themeConfig.legend, ...(userConfig.legend ?? {}) },
          title: { ...themeConfig.title, ...(userConfig.title ?? {}) },
        },
      } as VisualizationSpec;
    }

    return null;
  }, [providedSpec, themeConfig]);

  useEffect(() => {
    setError(null);
  }, [resolvedSpec]);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Vega-Lite render error:", err);
    setError(message);
  };

  if (!resolvedSpec) {
    return (
      <div className="text-sm text-muted-foreground">
        No chart spec provided.
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to render chart: {error}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 text-foreground">
      <VegaEmbed
        spec={resolvedSpec}
        options={{ actions: false }}
        onError={handleError}
        style={{ width: "100%" }}
      />
    </div>
  );
};
