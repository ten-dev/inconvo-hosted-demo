"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Card,
  Flex,
  Group,
  MantineProvider,
  Pagination,
  ScrollArea,
  SegmentedControl,
  Table,
  Text,
  rem,
  Code,
  Title,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

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

const DATABASE_VIEWER_TABLE_WIDTH = 640;

const DEFAULT_TABLE_ID = SEMANTIC_TABLES[0]?.id ?? null;

export default function HomePage() {
  const [topHeight, setTopHeight] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [focusedTableId, setFocusedTableId] = useState<string | null>(
    DEFAULT_TABLE_ID,
  );
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

  return (
    <Assistant>
      <MantineProvider defaultColorScheme="light">
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
                <Title order={3}>Database</Title>
                <DatabaseViewer
                  activeTableId={focusedTableId}
                />
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
        <Title order={3}>Semantic Model</Title>
        <Card withBorder radius="md" p="md">
          <Text fz="sm" c="dimmed">
            Select a table to inspect its semantic configuration.
          </Text>
        </Card>
      </div>
    );
  }

  const computedColumns = table.computedColumns ?? [];
  const hasContext = Boolean(table.context);

  return (
    <div className="flex flex-col gap-4">
      <Title order={3}>Semantic Model</Title>
      <Card withBorder radius="md" p="md">
        {hasContext && (
          <Box mb="md">
            <Badge color="grape" size="sm" variant="light">
              Context
            </Badge>
            <Card withBorder shadow="xs" p="md" mt="xs">
              <Group gap="xs" align="flex-start">
                <IconInfoCircle size={16} />
                <Text fz="sm">{table.context}</Text>
              </Group>
            </Card>
          </Box>
        )}

        <SemanticColumnsTable columns={table.columns} />

        {computedColumns.length > 0 && (
          <SemanticComputedColumnsTable computedColumns={computedColumns} />
        )}

        {table.relations.length > 0 && (
          <SemanticRelationsTable relations={table.relations} />
        )}
      </Card>
    </div>
  );
}

type SemanticColumnsTableProps = {
  columns: SemanticColumn[];
};

function SemanticColumnsTable({ columns }: SemanticColumnsTableProps) {
  return (
    <Box>
      <Badge color="gray" size="sm" variant="light">
        Columns
      </Badge>
      <Table verticalSpacing={6} mt="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {columns.map((column) => (
            <Table.Tr key={column.name}>
              <Table.Td>
                <Text fw={500}>{column.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{column.type}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

type SemanticComputedColumnsTableProps = {
  computedColumns: SemanticComputedColumn[];
};

function SemanticComputedColumnsTable({
  computedColumns,
}: SemanticComputedColumnsTableProps) {
  return (
    <Box mt="lg">
      <Badge color="teal" size="sm" variant="light">
        Computed columns
      </Badge>
      <Table verticalSpacing={6} mt="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Expression</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {computedColumns.map((column) => (
            <Table.Tr key={column.name}>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Text fw={500}>{column.name}</Text>
                  <Badge size="xs" color="teal" variant="light">
                    Computed
                  </Badge>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Text fz="sm">{column.type}</Text>
                  {column.unit && (
                    <Badge size="xs" variant="light">
                      {column.unit}
                    </Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                <Code fz="xs">{column.expression}</Code>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

type SemanticRelationsTableProps = {
  relations: SemanticRelation[];
};

function SemanticRelationsTable({
  relations,
}: SemanticRelationsTableProps) {
  if (relations.length === 0) {
    return null;
  }

  const formatMappings = (relation: SemanticRelation) => {
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
  };

  return (
    <Box mt="lg">
      <Badge color="violet" size="sm" variant="light">
        Relations
      </Badge>
      <Table verticalSpacing={6} mt="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Relation</Table.Th>
            <Table.Th>Target table</Table.Th>
            <Table.Th>Cardinality</Table.Th>
            <Table.Th>Mappings</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {relations.map((relation) => (
            <Table.Tr key={`${relation.name}-${relation.targetTable}`}>
              <Table.Td>
                <Text fw={500}>{relation.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text>{relation.targetTable}</Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">
                  {relation.isList ? "One-to-many" : "One-to-one"}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz="xs" c="dimmed">
                  {formatMappings(relation)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

type DatabaseSelectorProps = {
  activeTableId: string | null;
  onSelect: (tableId: string) => void;
};

function DatabaseSelector({
  activeTableId,
  onSelect,
}: DatabaseSelectorProps) {
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

  const hasViewerConfig = Boolean(
    selectedSemanticTable?.viewerColumns?.length,
  );

  const [page, setPage] = useState(1);
  const pageSize = 25;
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
  const showEmptyState =
    queryState.status === "success" && rows.length === 0;

  return (
    <Box mt="md">
      {isLoading ? (
        <Card withBorder radius="md" mt="md">
          <Text fz="sm">Loading rows…</Text>
        </Card>
      ) : isError ? (
        <Card withBorder radius="md" mt="md">
          <Text fz="sm" c="red">
            {queryState.error ?? "Unable to fetch data."}
          </Text>
        </Card>
      ) : showEmptyState ? (
        <Card withBorder radius="md" mt="md">
          <Text fz="sm">No rows available yet.</Text>
        </Card>
      ) : (
        <Box mt="md" style={{ width: `${DATABASE_VIEWER_TABLE_WIDTH}px`, maxWidth: "100%" }}>
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
        </Box>
      )}

      <Group justify="space-between" align="center" mt="md">
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
