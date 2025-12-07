"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Group,
  MantineProvider,
  Modal,
  Pagination,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Tooltip,
  rem,
  Code,
  Title,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconNote,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";

import { Assistant } from "./assistant";
import {
  SEMANTIC_TABLES,
  SEMANTIC_TABLE_MAP,
  type SemanticTable,
  type SemanticColumn,
  type SemanticComputedColumn,
  type SemanticRelation,
  type SemanticViewerColumn,
} from "~/data/database/semanticSchema";

const DATABASE_VIEWER_TABLE_WIDTH = 900;

const DEFAULT_TABLE_ID = SEMANTIC_TABLES[0]?.id ?? null;

type SectionSurfaceOptions = {
  padded?: boolean;
  backgroundColor?: string;
};

const getSectionSurfaceStyle = (
  options: SectionSurfaceOptions = {},
): CSSProperties => ({
  border: "1px solid var(--mantine-color-gray-3, #dee2e6)",
  borderRadius: rem(12),
  backgroundColor:
    options.backgroundColor ?? "var(--mantine-color-white, #ffffff)",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
  overflow: "hidden",
  padding: options.padded ? rem(12) : undefined,
});

export default function HomePage() {
  const [topHeight, setTopHeight] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [focusedTableId, setFocusedTableId] = useState<string | null>(
    DEFAULT_TABLE_ID,
  );
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedTable =
    focusedTableId && SEMANTIC_TABLE_MAP[focusedTableId]
      ? SEMANTIC_TABLE_MAP[focusedTableId]
      : null;

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newTopHeight = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp between 20% and 80%
    setTopHeight(Math.min(Math.max(newTopHeight, 20), 80));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const demoSteps = [
    {
      title: "Welcome to Inconvo Demo",
      content:
        "This interactive demo showcases how Inconvo helps you build semantic models on top of your database. Navigate through these steps to understand the key features.",
    },
    {
      title: "Semantic Model View",
      content:
        "The top panel displays your semantic model configuration. Here you can see columns, computed columns, and relationships that define how your data connects and behaves.",
    },
    {
      title: "Table Selector",
      content:
        "Use the segmented control below the title to switch between different tables in your database. Each table has its own semantic configuration.",
    },
    {
      title: "Live Data Preview",
      content:
        "The bottom panel shows real-time data from your selected table. This helps you verify that your semantic model correctly represents your actual data.",
    },
    {
      title: "AI Assistant",
      content:
        "Ask questions about your data in natural language! The AI assistant understands your semantic model and can query your database to answer questions.",
    },
  ];

  const totalSteps = demoSteps.length;
  const currentStepData = demoSteps[currentStep];

  return (
    <Assistant>
      <MantineProvider defaultColorScheme="light">
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title={currentStepData?.title}
          size="xl"
          centered
        >
          <Stack gap="lg">
            <Text size="sm">{currentStepData?.content}</Text>

            <Group justify="space-between" align="center">
              <Text size="xs" c="dimmed">
                Step {currentStep + 1} of {totalSteps}
              </Text>
              <Group gap="xs">
                <Button
                  variant="default"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  Previous
                </Button>
                {currentStep < totalSteps - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setInfoModalOpen(false)}>
                    Get Started
                  </Button>
                )}
              </Group>
            </Group>
          </Stack>
        </Modal>

        <main className="bg-background text-foreground flex min-h-screen flex-col">
          <Box
            component="section"
            style={{
              height: "calc(100vh - 2rem)",
              width: "100%",
              maxWidth: "100%",
              paddingTop: rem(24),
              paddingBottom: rem(24),
              paddingLeft: rem(32),
              paddingRight: rem(32),
            }}
          >
            <Box mb="md">
              <Group justify="space-between" align="center" mb={rem(6)}>
                <Title
                  order={3}
                  style={{
                    fontWeight: 600,
                  }}
                >
                  Inconvo Demo
                </Title>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="xl"
                  onClick={() => {
                    setInfoModalOpen(true);
                    setCurrentStep(0);
                  }}
                  aria-label="Information"
                >
                  <IconInfoCircle size={20} />
                </ActionIcon>
              </Group>
              <DatabaseSelector
                activeTableId={focusedTableId}
                onSelect={(id) => setFocusedTableId(id)}
              />
            </Box>
            <Flex
              direction="column"
              style={{ height: "100%", position: "relative" }}
              ref={containerRef}
            >
              <Card
                withBorder
                shadow="sm"
                radius="lg"
                style={{
                  height: `${topHeight}%`,
                  overflow: "auto",
                  marginBottom: 0,
                }}
              >
                <SemanticTableView table={selectedTable} />
              </Card>

              <Box
                style={{
                  height: "8px",
                  cursor: "ns-resize",
                  backgroundColor: isDragging ? "#228be6" : "transparent",
                  transition: isDragging ? "none" : "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 10,
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e7f5ff";
                }}
                onMouseLeave={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <Box
                  style={{
                    width: "40px",
                    height: "4px",
                    backgroundColor: "#adb5bd",
                    borderRadius: "2px",
                  }}
                />
              </Box>

              <Card
                withBorder
                shadow="sm"
                radius="lg"
                style={{
                  height: `${100 - topHeight}%`,
                  overflow: "auto",
                  marginTop: 0,
                }}
              >
                <Title order={6} mb="xs">
                  Example Data
                </Title>
                <DatabaseViewer activeTableId={focusedTableId} />
              </Card>
            </Flex>
          </Box>
        </main>
      </MantineProvider>
    </Assistant>
  );
}

type SemanticTableViewProps = {
  table: SemanticTable | null;
};

function SemanticTableView({ table }: SemanticTableViewProps) {
  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <Title order={6}>Semantic Model</Title>
        <Card withBorder radius="md" p="md">
          <Text fz="sm" c="dimmed">
            Select a table to inspect its semantic configuration.
          </Text>
        </Card>
      </div>
    );
  }

  const computedColumns = table.computedColumns ?? [];

  return (
    <div className="flex flex-col gap-3">
      <Title order={6}>Semantic Model</Title>
      <Card withBorder radius="lg" p="md">
        <Stack gap="md">
          {table.context && <SemanticContextSection context={table.context} />}

          <SemanticColumnsSection
            columns={table.columns}
            computedColumns={computedColumns}
          />

          {table.relations.length > 0 && (
            <SemanticRelationsSection relations={table.relations} />
          )}
        </Stack>
      </Card>
    </div>
  );
}

type SemanticColumnsSectionProps = {
  columns: SemanticColumn[];
  computedColumns: SemanticComputedColumn[];
};

type SemanticColumnRow =
  | { kind: "base"; column: SemanticColumn }
  | { kind: "computed"; column: SemanticComputedColumn };

function SemanticColumnsSection({
  columns,
  computedColumns,
}: SemanticColumnsSectionProps) {
  const rows: SemanticColumnRow[] = [
    ...computedColumns.map((column) => ({ kind: "computed", column })),
    ...columns.map((column) => ({ kind: "base", column })),
  ];

  return (
    <Box>
      <SemanticSectionHeader
        color="teal"
        label="Columns"
        countLabel={`Active Columns (${rows.length})`}
      />
      <Box style={getSectionSurfaceStyle()}>
        <Table
          horizontalSpacing="sm"
          verticalSpacing="xs"
          highlightOnHover
          style={{ fontSize: rem(12) }}
        >
          <Table.Thead
            style={{
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            <Table.Tr>
              <Table.Th style={{ width: rem(70) }}>On</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th style={{ width: rem(180) }}>Type</Table.Th>
              <Table.Th style={{ width: rem(120), textAlign: "right" }}>
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => {
              const key =
                row.kind === "computed"
                  ? `computed-${row.column.name}`
                  : row.column.name;

              return (
                <Table.Tr key={key}>
                  <Table.Td>
                    <Checkbox
                      size="xs"
                      checked
                      readOnly
                      aria-label={`Active column ${row.column.name}`}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" align="flex-start">
                      <Text fw={600} fz="xs">
                        {row.column.name}
                      </Text>
                      {row.kind === "computed" && (
                        <Badge size="xs" color="teal" variant="light">
                          Computed
                        </Badge>
                      )}
                      <Tooltip label="Rename column" withArrow>
                        <Box component="span">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="xs"
                            radius="md"
                            disabled
                            aria-label={`Rename column ${row.column.name}`}
                            style={{ cursor: "not-allowed", opacity: 0.6 }}
                          >
                            <IconPencil size={12} />
                          </ActionIcon>
                        </Box>
                      </Tooltip>
                    </Group>
                    {row.kind === "computed" && (
                      <Text fz="xs" c="dimmed" mt={2}>
                        = <Code fz="xs">{row.column.expression}</Code>
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Text fz="xs">{row.column.type}</Text>
                      {"unit" in row.column && row.column.unit && (
                        <Badge size="xs" variant="light">
                          {row.column.unit}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Add column note" withArrow>
                        <Box component="span">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            radius="xl"
                            size="xs"
                            disabled
                            aria-label={`Add column note for ${row.column.name}`}
                            style={{ cursor: "not-allowed", opacity: 0.6 }}
                          >
                            <IconNote size={12} />
                          </ActionIcon>
                        </Box>
                      </Tooltip>
                      {row.kind === "computed" && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="xs"
                          radius="md"
                          aria-label={`Remove computed column ${row.column.name}`}
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Box>
    </Box>
  );
}

type SemanticRelationsSectionProps = {
  relations: SemanticRelation[];
};

function SemanticRelationsSection({
  relations,
}: SemanticRelationsSectionProps) {
  return (
    <Box>
      <SemanticSectionHeader
        color="grape"
        label="Relations"
        countLabel={`Active Relations (${relations.length})`}
        action={
          <Button
            size="xs"
            variant="default"
            radius="md"
            disabled
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            + Add Manual Relation
          </Button>
        }
      />
      <Box style={getSectionSurfaceStyle()}>
        <Table
          horizontalSpacing="sm"
          verticalSpacing="xs"
          highlightOnHover
          style={{ fontSize: rem(12) }}
        >
          <Table.Thead
            style={{
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            <Table.Tr>
              <Table.Th style={{ width: rem(70) }}>On</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th style={{ width: rem(220) }}>Target Table</Table.Th>
              <Table.Th style={{ width: rem(120), textAlign: "right" }}>
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {relations.map((relation) => (
              <Table.Tr key={`${relation.name}-${relation.targetTable}`}>
                <Table.Td>
                  <Checkbox
                    size="xs"
                    checked
                    readOnly
                    aria-label={`Active relation ${relation.name}`}
                  />
                </Table.Td>
                <Table.Td>
                  <Text fw={600} fz="xs">
                    {relation.name}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {formatRelationMappings(relation)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="xs">{relation.targetTable}</Text>
                  <Text fz="xs" c="dimmed">
                    {relation.isList ? "One-to-many" : "One-to-one"}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Text c="dimmed" fz="xs">
                    —
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </Box>
  );
}

type SemanticContextSectionProps = {
  context: string;
};

function SemanticContextSection({ context }: SemanticContextSectionProps) {
  return (
    <Box>
      <SemanticSectionHeader color="gray" label="Context" />
      <Box
        style={getSectionSurfaceStyle({
          padded: true,
          backgroundColor: "var(--mantine-color-gray-0)",
        })}
      >
        <Group gap="xs" align="flex-start">
          <IconInfoCircle size={14} />
          <Text fz="xs">{context}</Text>
        </Group>
      </Box>
    </Box>
  );
}

type SemanticSectionHeaderProps = {
  label: string;
  color: string;
  countLabel?: string;
  action?: ReactNode;
};

function SemanticSectionHeader({
  label,
  color,
  countLabel,
  action,
}: SemanticSectionHeaderProps) {
  const showMeta = Boolean(countLabel ?? action);

  return (
    <Group justify="space-between" mb={4} align="center">
      <Badge color={color} size="xs" radius="sm">
        {label.toUpperCase()}
      </Badge>
      {showMeta && (
        <Group gap={6}>
          {countLabel && (
            <Text fz="xs" c="dimmed">
              {countLabel}
            </Text>
          )}
          {action}
        </Group>
      )}
    </Group>
  );
}

function formatRelationMappings(relation: SemanticRelation) {
  if (!relation.sourceColumns || relation.sourceColumns.length === 0) {
    return "—";
  }

  return relation.sourceColumns
    .map((sourceColumn, index) => {
      const targetColumn = relation.targetColumns?.[index];
      if (targetColumn) {
        return `${sourceColumn} → ${targetColumn}`;
      }
      if (relation.targetColumns && relation.targetColumns.length > 0) {
        return `${sourceColumn} → ${relation.targetColumns[0]}`;
      }
      return sourceColumn;
    })
    .join(", ");
}

type DatabaseSelectorProps = {
  activeTableId: string | null;
  onSelect: (tableId: string) => void;
};

function DatabaseSelector({ activeTableId, onSelect }: DatabaseSelectorProps) {
  const fallbackId = DEFAULT_TABLE_ID;
  const value =
    activeTableId && SEMANTIC_TABLE_MAP[activeTableId]
      ? activeTableId
      : fallbackId;

  if (!value) {
    return null;
  }

  const segments = SEMANTIC_TABLES.map((table) => ({
    value: table.id,
    label: (
      <Text fw={600} fz="xs" tt="lowercase">
        {table.name}
      </Text>
    ),
  }));

  return (
    <SegmentedControl
      size="sm"
      radius="md"
      value={value}
      onChange={onSelect}
      data={segments}
      fullWidth
    />
  );
}

type DatabaseViewerProps = {
  activeTableId: string | null;
};

function DatabaseViewer({ activeTableId }: DatabaseViewerProps) {
  const fallbackTableId = DEFAULT_TABLE_ID;
  const selectedTableId =
    activeTableId && SEMANTIC_TABLE_MAP[activeTableId]
      ? activeTableId
      : fallbackTableId;

  const selectedSemanticTable =
    selectedTableId && SEMANTIC_TABLE_MAP[selectedTableId]
      ? SEMANTIC_TABLE_MAP[selectedTableId]
      : null;

  const hasViewerConfig = Boolean(selectedSemanticTable?.viewerColumns?.length);

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [queryState, setQueryState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    rows: Record<string, unknown>[];
    totalPages: number;
    totalCount: number;
    error?: string;
  }>({
    status: "idle",
    rows: [],
    totalPages: 1,
    totalCount: 0,
    error: undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [selectedTableId]);

  useEffect(() => {
    if (!selectedSemanticTable || !hasViewerConfig) {
      setQueryState((prev) => ({
        ...prev,
        status: "idle",
        rows: [],
        totalPages: 1,
        totalCount: 0,
        error: undefined,
      }));
      return;
    }

    const controller = new AbortController();
    setQueryState((prev) => ({
      ...prev,
      status: "loading",
      error: undefined,
    }));

    const params = new URLSearchParams({
      table: selectedSemanticTable.name,
      page: String(page),
      pageSize: String(pageSize),
    });

    fetch(`/api/database?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }
        const payload = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Unable to fetch database table",
        );
      })
      .then((payload) => {
        setQueryState({
          status: "success",
          rows: Array.isArray(payload?.rows) ? payload.rows : [],
          totalPages: payload?.totalPages ?? 1,
          totalCount: payload?.totalCount ?? 0,
          error: undefined,
        });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setQueryState({
          status: "error",
          rows: [],
          totalPages: 1,
          totalCount: 0,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load table rows",
        });
      });

    return () => controller.abort();
  }, [
    selectedSemanticTable?.id,
    selectedSemanticTable?.name,
    hasViewerConfig,
    page,
    pageSize,
  ]);

  useEffect(() => {
    setPage((current) => {
      const maxPage = Math.max(1, queryState.totalPages);
      return current > maxPage ? maxPage : current;
    });
  }, [queryState.totalPages]);

  if (!selectedSemanticTable) {
    return (
      <Card withBorder radius="md" mt="md" p="md">
        <Text fz="sm" c="dimmed">
          No tables are configured for this workspace yet.
        </Text>
      </Card>
    );
  }

  if (!hasViewerConfig) {
    return (
      <Card withBorder radius="md" mt="md" p="md">
        <Text fz="sm" c="dimmed">
          This table is not configured for the live data preview yet.
        </Text>
      </Card>
    );
  }

  const columnsToDisplay = selectedSemanticTable.viewerColumns ?? [];
  const rows = queryState.rows;
  const isLoading = queryState.status === "loading";
  const isError = queryState.status === "error";
  const showEmptyState = queryState.status === "success" && rows.length === 0;

  return (
    <Box>
      {isLoading ? (
        <Card withBorder radius="md">
          <Text fz="sm">Loading rows…</Text>
        </Card>
      ) : isError ? (
        <Card withBorder radius="md">
          <Text fz="sm" c="red">
            {queryState.error ?? "Unable to fetch data."}
          </Text>
        </Card>
      ) : showEmptyState ? (
        <Card withBorder radius="md">
          <Text fz="sm">No rows available yet.</Text>
        </Card>
      ) : (
        <Box
          style={{
            width: `${DATABASE_VIEWER_TABLE_WIDTH}px`,
            maxWidth: "100%",
          }}
        >
          <ScrollArea h={rem(280)} offsetScrollbars style={{ width: "100%" }}>
            <Table
              verticalSpacing={4}
              horizontalSpacing={6}
              withTableBorder
              withColumnBorders
              style={{
                fontSize: "0.85rem",
                fontFamily: "monospace",
                width: "100%",
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  {columnsToDisplay.map((column) => (
                    <Table.Th
                      key={column.field}
                      style={{
                        textTransform: "none",
                        backgroundColor: "var(--mantine-color-gray-1)",
                        fontWeight: 600,
                      }}
                    >
                      {column.label ?? column.field}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, rowIndex) => (
                  <Table.Tr key={`${selectedSemanticTable.id}-${rowIndex}`}>
                    {columnsToDisplay.map((column) => {
                      const rawValue = row[column.field];
                      return (
                        <Table.Td key={`${rowIndex}-${column.field}`}>
                          <Text fz="xs" ff="monospace">
                            {formatCellValue(rawValue, column)}
                          </Text>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          <Group justify="space-between" align="center" mt="xs">
            <Text fz="xs" c="dimmed">
              {queryState.totalCount > 0
                ? `Showing ${rows.length} of ${queryState.totalCount} rows`
                : `Showing ${rows.length} rows`}
            </Text>
            {queryState.totalPages > 1 && (
              <Pagination
                size="sm"
                value={page}
                total={queryState.totalPages}
                onChange={setPage}
              />
            )}
          </Group>
        </Box>
      )}
    </Box>
  );
}

function formatCellValue(
  value: unknown,
  column?: SemanticViewerColumn,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    const formattedNumber =
      column?.unit === "USD"
        ? `$${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : value.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          });

    if (column?.unit && column.unit !== "USD") {
      return `${formattedNumber} ${column.unit}`;
    }
    return formattedNumber;
  }

  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp) && value.includes("T")) {
      return new Date(timestamp).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
    return value;
  }

  return String(value);
}
