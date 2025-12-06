"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Checkbox,
  Collapse,
  Container,
  Flex,
  Group,
  MantineProvider,
  Pagination,
  ScrollArea,
  SegmentedControl,
  Table,
  Text,
  TextInput,
  Tooltip,
  rem,
  Code,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconChevronDown,
  IconChevronUp,
  IconCircleOff,
  IconCirclesRelation,
  IconDatabaseEdit,
  IconFilter,
  IconInfoCircle,
  IconMathFunction,
  IconRuler,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import { Assistant } from "./assistant";

const tableAccessLabels = {
  QUERYABLE: { label: "Queryable", color: "green" },
  JOINABLE: { label: "Joinable", color: "orange" },
  OFF: { label: "Off", color: "gray" },
} as const;

type TableAccess = keyof typeof tableAccessLabels;

type ColumnSchema = {
  id: string;
  name: string;
  rename?: string | null;
  type: string;
  unit?: string | null;
  selected: boolean;
  notes?: string | null;
};

type ComputedColumnSchema = {
  id: string;
  name: string;
  expression: string;
  selected: boolean;
  type: string;
  unit?: string | null;
  notes?: string | null;
};

type RelationMapping = {
  id: string;
  sourceColumnName: string;
  targetColumnName: string;
};

type RelationSchema = {
  id: string;
  name: string;
  targetTable: { id: string; name: string; access: TableAccess };
  selected: boolean;
  status: "VALID" | "BROKEN";
  source: "MANUAL" | "SYNCED";
  isList: boolean;
  errorTag?: string;
  columnMappings: RelationMapping[];
};

type TableCondition = {
  column: { id: string; name: string };
  requestContextField: { id: string; key: string };
};

type TableSchema = {
  id: string;
  name: string;
  description: string;
  access: TableAccess;
  columns: ColumnSchema[];
  computedColumns: ComputedColumnSchema[];
  outwardRelations: RelationSchema[];
  condition?: TableCondition;
  contextPrompt?: string;
};

type TableProps = {
  tableIds: { id: string }[];
  totalTables: number;
  currentPage: number;
  searchQuery: string;
  accessFilters: TableAccess[];
};

type DatabaseFixture = {
  summary: TableProps;
  tables: Record<string, TableSchema>;
};

const DATABASE_FIXTURE: DatabaseFixture = {
  summary: {
    tableIds: [
      { id: "tbl_customers" },
      { id: "tbl_orders" },
      { id: "tbl_order_items" },
      { id: "tbl_abandoned_carts" },
    ],
    totalTables: 4,
    currentPage: 1,
    searchQuery: "",
    accessFilters: ["QUERYABLE", "JOINABLE"],
  },
  tables: {
    tbl_customers: {
      id: "tbl_customers",
      name: "customers",
      description:
        "Profiles for every shopper that has created an account in the hosted demo storefront.",
      access: "QUERYABLE",
      columns: [
        {
          id: "cust_1",
          name: "customer_id",
          type: "uuid",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "cust_2",
          name: "email",
          type: "text",
          selected: true,
          notes: "Lower-cased email with partial masking",
        },
        {
          id: "cust_3",
          name: "full_name",
          rename: "customer_name",
          type: "text",
          selected: true,
        },
        {
          id: "cust_4",
          name: "region_code",
          type: "text",
          selected: true,
        },
        {
          id: "cust_5",
          name: "marketing_opt_in",
          type: "boolean",
          selected: false,
        },
        {
          id: "cust_6",
          name: "last_active_at",
          type: "timestamp",
          selected: false,
        },
      ],
      computedColumns: [
        {
          id: "cc_1",
          name: "lifetime_value",
          expression: "sum(order_total)",
          selected: true,
          type: "numeric",
          unit: "USD",
        },
        {
          id: "cc_2",
          name: "avg_order_value",
          expression: "lifetime_value / completed_orders",
          selected: false,
          type: "numeric",
          unit: "USD",
        },
      ],
      outwardRelations: [
        {
          id: "rel_1",
          name: "Orders",
          targetTable: {
            id: "tbl_orders",
            name: "orders",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_1",
              sourceColumnName: "customer_id",
              targetColumnName: "customer_id",
            },
          ],
        },
        {
          id: "rel_2",
          name: "Abandoned carts",
          targetTable: {
            id: "tbl_abandoned_carts",
            name: "abandoned_carts",
            access: "OFF",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_4",
              sourceColumnName: "customer_id",
              targetColumnName: "customer_id",
            },
          ],
        },
      ],
      condition: {
        column: { id: "cust_2", name: "email" },
        requestContextField: { id: "ctx_1", key: "customer_email" },
      },
      contextPrompt:
        "Use this table when answering customer-centric questions. Hide direct email addresses in responses.",
    },
    tbl_orders: {
      id: "tbl_orders",
      name: "orders",
      description: "Transactional header table for ecommerce orders.",
      access: "QUERYABLE",
      columns: [
        {
          id: "ord_1",
          name: "order_id",
          type: "uuid",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "ord_2",
          name: "customer_id",
          type: "uuid",
          selected: true,
        },
        {
          id: "ord_3",
          name: "order_status",
          type: "text",
          selected: true,
        },
        {
          id: "ord_4",
          name: "currency_code",
          type: "text",
          selected: true,
        },
        {
          id: "ord_5",
          name: "order_total",
          type: "numeric(12,2)",
          unit: "USD",
          selected: true,
        },
        {
          id: "ord_6",
          name: "ordered_at",
          type: "timestamp",
          selected: true,
        },
        {
          id: "ord_7",
          name: "fulfilled_at",
          type: "timestamp",
          selected: false,
        },
      ],
      computedColumns: [
        {
          id: "cc_3",
          name: "shipping_latency_hours",
          expression: "date_diff('hour', ordered_at, fulfilled_at)",
          selected: true,
          type: "numeric",
          unit: "hours",
        },
      ],
      outwardRelations: [
        {
          id: "rel_3",
          name: "Customer",
          targetTable: {
            id: "tbl_customers",
            name: "customers",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_2",
              sourceColumnName: "customer_id",
              targetColumnName: "customer_id",
            },
          ],
        },
        {
          id: "rel_4",
          name: "Order items",
          targetTable: {
            id: "tbl_order_items",
            name: "order_items",
            access: "JOINABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_3",
              sourceColumnName: "order_id",
              targetColumnName: "order_id",
            },
          ],
        },
      ],
      contextPrompt:
        "Orders pairs with order_items for granular product-level insights. Shipping latency exposes performance issues.",
    },
    tbl_order_items: {
      id: "tbl_order_items",
      name: "order_items",
      description:
        "Line-level data for each SKU purchased inside an order, used for JOIN operations only.",
      access: "JOINABLE",
      columns: [
        {
          id: "oi_1",
          name: "item_id",
          type: "uuid",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "oi_2",
          name: "order_id",
          type: "uuid",
          selected: true,
        },
        {
          id: "oi_3",
          name: "sku",
          type: "text",
          selected: true,
        },
        {
          id: "oi_4",
          name: "quantity",
          type: "int",
          selected: true,
        },
        {
          id: "oi_5",
          name: "unit_price",
          type: "numeric(10,2)",
          unit: "USD",
          selected: true,
        },
        {
          id: "oi_6",
          name: "discount_amount",
          type: "numeric(10,2)",
          unit: "USD",
          selected: false,
        },
      ],
      computedColumns: [
        {
          id: "cc_4",
          name: "line_total",
          expression: "(unit_price - discount_amount) * quantity",
          selected: true,
          type: "numeric",
          unit: "USD",
        },
      ],
      outwardRelations: [
        {
          id: "rel_5",
          name: "Parent order",
          targetTable: {
            id: "tbl_orders",
            name: "orders",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_5",
              sourceColumnName: "order_id",
              targetColumnName: "order_id",
            },
          ],
        },
      ],
      contextPrompt:
        "Join order_items with orders.cfg to expose SKU-level performance metrics.",
    },
    tbl_abandoned_carts: {
      id: "tbl_abandoned_carts",
      name: "abandoned_carts",
      description:
        "Sessions where the shopper added items to the cart but never completed checkout.",
      access: "OFF",
      columns: [
        {
          id: "ac_1",
          name: "cart_id",
          type: "uuid",
          selected: false,
          notes: "Primary key",
        },
        {
          id: "ac_2",
          name: "customer_id",
          type: "uuid",
          selected: false,
        },
        {
          id: "ac_3",
          name: "device_type",
          type: "text",
          selected: false,
        },
        {
          id: "ac_4",
          name: "last_seen_at",
          type: "timestamp",
          selected: false,
        },
        {
          id: "ac_5",
          name: "total_value",
          type: "numeric(10,2)",
          unit: "USD",
          selected: false,
        },
      ],
      computedColumns: [],
      outwardRelations: [
        {
          id: "rel_6",
          name: "Customer",
          targetTable: {
            id: "tbl_customers",
            name: "customers",
            access: "QUERYABLE",
          },
          selected: false,
          status: "BROKEN",
          source: "MANUAL",
          errorTag: "Missing customer_id mapping",
          isList: false,
          columnMappings: [
            {
              id: "map_6",
              sourceColumnName: "customer_id",
              targetColumnName: "customer_id",
            },
          ],
        },
      ],
      contextPrompt:
        "Target carts are disabled in this demo to keep experimental cohorts private.",
    },
  },
};

const filterOptions = [
  {
    label: (
      <Group gap={4} align="center">
        <IconSearch size={12} />
        <IconCirclesRelation size={12} />
        <Text fw={600} fz="xs">
          Active
        </Text>
      </Group>
    ),
    value: "active",
  },
  {
    label: (
      <Group gap={4} align="center">
        <IconSearch size={12} />
        <Text fw={600} fz="xs">
          Queryable
        </Text>
      </Group>
    ),
    value: "queryable",
  },
  {
    label: (
      <Group gap={4} align="center">
        <IconCirclesRelation size={12} />
        <Text fw={600} fz="xs">
          Joinable
        </Text>
      </Group>
    ),
    value: "joinable",
  },
  {
    label: (
      <Group gap={4} align="center">
        <IconCircleOff size={12} />
        <Text fw={600} fz="xs">
          Off
        </Text>
      </Group>
    ),
    value: "off",
  },
  {
    label: (
      <Group gap={4} align="center">
        <IconSearch size={12} />
        <IconCirclesRelation size={12} />
        <IconCircleOff size={12} />
        <Text fw={600} fz="xs">
          All
        </Text>
      </Group>
    ),
    value: "all",
  },
] as const;

type AccessFilterKey = (typeof filterOptions)[number]["value"];

const accessFilterMap: Record<AccessFilterKey, TableAccess[]> = {
  active: ["QUERYABLE", "JOINABLE"],
  queryable: ["QUERYABLE"],
  joinable: ["JOINABLE"],
  off: ["OFF"],
  all: ["QUERYABLE", "JOINABLE", "OFF"],
};

export default function HomePage() {
  return (
    <Assistant>
      <MantineProvider defaultColorScheme="light">
        <main className="bg-background text-foreground flex min-h-screen flex-col">
          <Container size="xl" py="lg" style={{ height: "calc(100vh - 2rem)" }}>
            <Flex direction="column" gap="md" style={{ height: "100%" }}>
              <Card
                withBorder
                shadow="sm"
                radius="lg"
                style={{ flex: "1 1 50%", overflow: "auto" }}
              >
                <TablesDemo />
              </Card>
              <Card
                withBorder
                shadow="sm"
                radius="lg"
                style={{ flex: "1 1 50%", overflow: "auto" }}
              >
                <Title>Database</Title>
              </Card>
            </Flex>
          </Container>
        </main>
      </MantineProvider>
    </Assistant>
  );
}

function TablesDemo() {
  const [searchValue, setSearchValue] = useState(
    DATABASE_FIXTURE.summary.searchQuery,
  );
  const [debouncedSearch] = useDebouncedValue(searchValue, 200);
  const [filter, setFilter] = useState<AccessFilterKey>("active");
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);

  const filteredIds = useMemo(() => {
    const allowed = accessFilterMap[filter];
    return DATABASE_FIXTURE.summary.tableIds
      .map(({ id }) => DATABASE_FIXTURE.tables[id])
      .filter((table): table is TableSchema => Boolean(table))
      .filter((table) => allowed.includes(table.access))
      .filter((table) => {
        if (!debouncedSearch.trim()) {
          return true;
        }
        const needle = debouncedSearch.trim().toLowerCase();
        const haystack = [
          table.name,
          table.description,
          table.columns.map((c) => c.name).join(" "),
          table.computedColumns.map((c) => c.name).join(" "),
          table.outwardRelations.map((r) => r.name).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .map((table) => table.id);
  }, [debouncedSearch, filter]);

  const handleExpand = (id: string) => {
    setExpandedTableId((current) => (current === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-4">
      <Title>Semantic Model</Title>
      <Group justify="space-between" wrap="nowrap" gap="md">
        <TextInput
          placeholder="Search tables..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
          rightSection={
            searchValue ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setSearchValue("")}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : (
              <IconSearch size={14} opacity={0.6} />
            )
          }
          style={{ flex: "1 1 30%" }}
        />

        <SegmentedControl
          size="sm"
          data={filterOptions}
          value={filter}
          onChange={(value) => setFilter(value as AccessFilterKey)}
          style={{ flex: "1 1 70%" }}
        />
      </Group>
      {filteredIds.length === 0 ? (
        <Card withBorder radius="md" ta="center" py="lg">
          <Text c="dimmed" fz="sm">
            No tables match your filters.
          </Text>
        </Card>
      ) : (
        <ScrollArea offsetScrollbars>
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Table name</Table.Th>
                <Table.Th w={150}>Access</Table.Th>
                <Table.Th w={200}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredIds.map((id) => {
                const table = DATABASE_FIXTURE.tables[id];
                if (!table) return null;
                return (
                  <TableRowView
                    key={table.id}
                    table={table}
                    isExpanded={expandedTableId === table.id}
                    onToggle={() => handleExpand(table.id)}
                  />
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
      {DATABASE_FIXTURE.summary.totalTables > 20 && (
        <Group justify="center" mt="xl">
          <Pagination
            total={Math.ceil(DATABASE_FIXTURE.summary.totalTables / 20)}
            value={DATABASE_FIXTURE.summary.currentPage}
            onChange={() => undefined}
          />
        </Group>
      )}
    </div>
  );
}

type TableRowProps = {
  table: TableSchema;
  isExpanded: boolean;
  onToggle: () => void;
};

function TableRowView({ table, isExpanded, onToggle }: TableRowProps) {
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const [relationActiveExpanded, setRelationActiveExpanded] = useState(true);
  const [relationInactiveExpanded, setRelationInactiveExpanded] =
    useState(false);
  const [relationDisabledExpanded, setRelationDisabledExpanded] =
    useState(false);

  const activeColumns = table.columns.filter((column) => column.selected);
  const inactiveColumns = table.columns.filter((column) => !column.selected);
  const activeComputed = table.computedColumns.filter(
    (column) => column.selected,
  );
  const inactiveComputed = table.computedColumns.filter(
    (column) => !column.selected,
  );
  const activeRelations = table.outwardRelations.filter(
    (relation) =>
      relation.selected &&
      relation.status === "VALID" &&
      relation.targetTable.access !== "OFF",
  );
  const inactiveRelations = table.outwardRelations.filter(
    (relation) => !relation.selected && relation.targetTable.access !== "OFF",
  );
  const disabledRelations = table.outwardRelations.filter(
    (relation) =>
      relation.targetTable.access === "OFF" || relation.status === "BROKEN",
  );

  return (
    <>
      <Table.Tr>
        <Table.Td onClick={onToggle} style={{ cursor: "pointer" }}>
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text fw={isExpanded ? 600 : 400} tt="lowercase">
                {table.name}
              </Text>
              {table.description && (
                <Text fz="xs" c="dimmed">
                  {table.description}
                </Text>
              )}
              {table.condition && (
                <Text fz="xs" c="dimmed">
                  (where {table.condition.column.name} = requestContext.
                  {table.condition.requestContextField.key})
                </Text>
              )}
            </div>
            <ActionIcon variant="subtle" onClick={onToggle}>
              {isExpanded ? (
                <IconChevronUp size={16} />
              ) : (
                <IconChevronDown size={16} />
              )}
            </ActionIcon>
          </Group>
        </Table.Td>
        <Table.Td>
          <SegmentedControl
            size="xs"
            value={table.access}
            onChange={() => undefined}
            data={[
              { value: "QUERYABLE", label: <IconSearch size={10} /> },
              { value: "JOINABLE", label: <IconCirclesRelation size={10} /> },
              { value: "OFF", label: <IconCircleOff size={10} /> },
            ]}
            color={tableAccessLabels[table.access].color}
            disabled
          />
        </Table.Td>
        <Table.Td>
          <Group gap={8} wrap="nowrap">
            <Tooltip label="Disabled in demo">
              <ActionIcon variant="light" color="blue" size="sm" disabled>
                <IconDatabaseEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Disabled in demo">
              <ActionIcon variant="light" color="blue" size="sm" disabled>
                <IconMathFunction size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Disabled in demo">
              <ActionIcon variant="light" color="blue" size="sm" disabled>
                <IconFilter size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Disabled in demo">
              <ActionIcon variant="light" color="blue" size="sm" disabled>
                <IconRuler size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>

      {isExpanded && (
        <Table.Tr>
          <Table.Td colSpan={3} p={0}>
            <Collapse in={isExpanded} transitionDuration={200}>
              <Card radius={0} withBorder>
                <ScrollArea h={rem(520)} offsetScrollbars>
                  <Box style={{ flex: 1 }}>
                    <Box mb="md">
                      <Badge color="teal" size="sm">
                        Columns
                      </Badge>
                      <ColumnsTable
                        title="Active columns"
                        columns={activeColumns}
                        computedColumns={activeComputed}
                        isOpen={activeExpanded}
                        toggle={() => setActiveExpanded((value) => !value)}
                      />
                      <ColumnsTable
                        title="Inactive columns"
                        columns={inactiveColumns}
                        computedColumns={inactiveComputed}
                        isOpen={inactiveExpanded}
                        toggle={() => setInactiveExpanded((value) => !value)}
                        muted
                      />
                    </Box>

                    <Box mb="md">
                      <Badge color="blue" size="sm">
                        Where condition
                      </Badge>
                      <Code block mt="xs">
                        {table.condition ? (
                          <Text fz="sm">
                            Where {table.name}.{table.condition.column.name} =
                            requestContext.
                            {table.condition.requestContextField.key}
                          </Text>
                        ) : (
                          <Text fz="sm" c="dimmed">
                            No row-level filter configured.
                          </Text>
                        )}
                      </Code>
                    </Box>

                    <Box>
                      <Badge color="violet" size="sm">
                        Relations
                      </Badge>
                      <RelationsTable
                        title="Active relations"
                        relations={activeRelations}
                        isOpen={relationActiveExpanded}
                        toggle={() =>
                          setRelationActiveExpanded((value) => !value)
                        }
                      />
                      <RelationsTable
                        title="Inactive relations"
                        relations={inactiveRelations}
                        isOpen={relationInactiveExpanded}
                        toggle={() =>
                          setRelationInactiveExpanded((value) => !value)
                        }
                        muted
                      />
                      <RelationsTable
                        title="Disabled relations"
                        relations={disabledRelations}
                        isOpen={relationDisabledExpanded}
                        toggle={() =>
                          setRelationDisabledExpanded((value) => !value)
                        }
                        muted
                      />
                    </Box>

                    <Box mt="md">
                      <Badge color="grape" size="sm">
                        Context
                      </Badge>
                      <Card withBorder shadow="xs" p="md" mt="xs">
                        <Group gap="xs">
                          <IconInfoCircle size={16} />
                          <Text fw={600} fz="sm">
                            Table prompt
                          </Text>
                        </Group>
                        <Text fz="sm" mt="sm">
                          {table.contextPrompt ??
                            "No custom table prompt configured."}
                        </Text>
                      </Card>
                    </Box>
                  </Box>
                </ScrollArea>
              </Card>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}

type ColumnsTableProps = {
  title: string;
  columns: ColumnSchema[];
  computedColumns: ComputedColumnSchema[];
  isOpen: boolean;
  toggle: () => void;
  muted?: boolean;
};

function ColumnsTable({
  title,
  columns,
  computedColumns,
  isOpen,
  toggle,
  muted,
}: ColumnsTableProps) {
  if (columns.length === 0 && computedColumns.length === 0) {
    return null;
  }

  return (
    <Card
      withBorder
      radius="md"
      mt="sm"
      p="xs"
      bg={muted ? "gray.0" : undefined}
    >
      <Group
        justify="space-between"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      >
        <Text fw={600} fz="sm">
          {title} ({columns.length + computedColumns.length})
        </Text>
        {isOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
      </Group>
      <Collapse in={isOpen}>
        <Table verticalSpacing={6} mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={60}>On</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Description</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {columns.map((column) => (
              <Table.Tr key={column.id}>
                <Table.Td>
                  <Checkbox checked={column.selected} readOnly disabled />
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Text>{column.rename ?? column.name}</Text>
                    {column.rename && column.rename !== column.name && (
                      <Badge size="xs" color="yellow" variant="light">
                        Renamed
                      </Badge>
                    )}
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
                  <Text fz="xs" c="dimmed">
                    {column.notes ?? "—"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {computedColumns.map((column) => (
              <Table.Tr key={column.id}>
                <Table.Td>
                  <Checkbox checked={column.selected} readOnly disabled />
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Text>{column.name}</Text>
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
                  <Code fz="xs">= {column.expression}</Code>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Collapse>
    </Card>
  );
}

type RelationsTableProps = {
  title: string;
  relations: RelationSchema[];
  isOpen: boolean;
  toggle: () => void;
  muted?: boolean;
};

function RelationsTable({
  title,
  relations,
  isOpen,
  toggle,
  muted,
}: RelationsTableProps) {
  if (relations.length === 0) {
    return null;
  }

  return (
    <Card
      withBorder
      radius="md"
      mt="sm"
      p="xs"
      bg={muted ? "gray.0" : undefined}
    >
      <Group
        justify="space-between"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      >
        <Text fw={600} fz="sm">
          {title} ({relations.length})
        </Text>
        {isOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
      </Group>
      <Collapse in={isOpen}>
        <Table verticalSpacing={6} mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={60}>On</Table.Th>
              <Table.Th>Relation</Table.Th>
              <Table.Th>Target table</Table.Th>
              <Table.Th>Mappings</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {relations.map((relation) => (
              <Table.Tr key={relation.id}>
                <Table.Td>
                  <Checkbox
                    checked={relation.selected}
                    readOnly
                    disabled
                    styles={{ input: { cursor: "not-allowed" } }}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="wrap" align="center">
                    <Text>{relation.name}</Text>
                    {relation.source === "MANUAL" && (
                      <Badge size="xs" color="violet">
                        Manual
                      </Badge>
                    )}
                    {relation.status === "BROKEN" && (
                      <Badge size="xs" color="red">
                        Broken
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="wrap" align="center">
                    <Text>{relation.targetTable.name}</Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color={
                        tableAccessLabels[relation.targetTable.access].color
                      }
                    >
                      {tableAccessLabels[relation.targetTable.access].label}
                    </Badge>
                    {relation.isList && (
                      <Badge size="xs" variant="light">
                        List
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text fz="xs" c="dimmed">
                    {relation.columnMappings
                      .map(
                        (mapping) =>
                          `${mapping.sourceColumnName} → ${mapping.targetColumnName}`,
                      )
                      .join(", ") || "—"}
                    {relation.errorTag ? ` · ${relation.errorTag}` : ""}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Collapse>
    </Card>
  );
}
