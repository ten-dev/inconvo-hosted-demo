"use client";

import { Box, Loader, Select, Text, rem } from "@mantine/core";

export type OrganisationOption = {
  id: number;
  name: string;
};

export type OrganisationLoadState = "loading" | "ready" | "error";

export type OrganisationSelectorProps = {
  options: OrganisationOption[];
  value: number | null;
  status: OrganisationLoadState;
  error: string | null;
  onChange: (value: number | null) => void;
  label?: string;
  minWidth?: number | string;
  showHelperText?: boolean;
  helperTextOverride?: string | null;
};

export function OrganisationSelector({
  options,
  value,
  status,
  error,
  onChange,
  label = "Organisation scope",
  minWidth = rem(220),
  showHelperText = true,
  helperTextOverride,
}: OrganisationSelectorProps) {
  const formatOptionLabel = (option: OrganisationOption) =>
    `${option.name} (organisation.id: ${option.id})`;

  const data = options.map((option) => ({
    value: String(option.id),
    label: formatOptionLabel(option),
  }));

  const selectedOption =
    value !== null ? options.find((option) => option.id === value) : null;

  const placeholder =
    status === "loading"
      ? "Loading organisations…"
      : options.length === 0
        ? "No organisations found"
        : "Select organisation";

  const helperText =
    helperTextOverride ??
    (status === "error"
      ? error ?? "Unable to load organisations"
      : selectedOption
        ? `Chat scoped to ${formatOptionLabel(selectedOption)}`
        : "Select an organisation to scope the assistant");

  return (
    <Box style={{ minWidth }}>
      <Text fz="xs" c="dimmed" mb={4}>
        {label}
      </Text>
      <Select
        aria-label={label}
        data={data}
        placeholder={placeholder}
        size="xs"
        radius="md"
        value={value !== null ? String(value) : null}
        onChange={(next) => {
          if (next === null) {
            onChange(null);
            return;
          }
          const parsed = Number.parseInt(next, 10);
          onChange(Number.isNaN(parsed) ? null : parsed);
        }}
        disabled={status === "loading" || options.length === 0}
        rightSection={
          status === "loading" ? <Loader size="xs" /> : undefined
        }
        comboboxProps={{ withinPortal: true }}
      />
      {showHelperText && (
        <Text
          fz="xs"
          c={status === "error" ? "red" : "dimmed"}
          mt={4}
          style={{ lineHeight: 1.4 }}
        >
          {helperText}
        </Text>
      )}
    </Box>
  );
}
