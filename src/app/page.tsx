"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { useEffect, useRef, useState } from "react";
import {
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
  rem,
  Code,
  Title,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
} from "@tabler/icons-react";

import { Assistant } from "./assistant";
import type { DatabaseTableName } from "~/data/database/tables";

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
      { id: "tbl_organisations" },
      { id: "tbl_users" },
      { id: "tbl_products" },
      { id: "tbl_orders" },
      { id: "tbl_reviews" },
    ],
    totalTables: 5,
    currentPage: 1,
    searchQuery: "",
    accessFilters: ["QUERYABLE", "JOINABLE"],
  },
  tables: {
    tbl_organisations: {
      id: "tbl_organisations",
      name: "organisations",
      description: "Top-level tenants that own data partitions inside the ecommerce warehouse.",
      access: "QUERYABLE",
      columns: [
        {
          id: "org_1",
          name: "id",
          type: "int",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "org_2",
          name: "name",
          type: "text",
          selected: true,
        },
        {
          id: "org_3",
          name: "created_at",
          type: "timestamp",
          notes: "UTC",
          selected: true,
        },
      ],
      computedColumns: [
        {
          id: "cc_org_1",
          name: "active_users_last_30d",
          expression: "count(distinct users.id) where users.last_order_at > now() - interval '30 days'",
          selected: true,
          type: "numeric",
        },
      ],
      outwardRelations: [
        {
          id: "rel_org_users",
          name: "Users",
          targetTable: {
            id: "tbl_users",
            name: "users",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_org_users",
              sourceColumnName: "id",
              targetColumnName: "organisation_id",
            },
          ],
        },
        {
          id: "rel_org_products",
          name: "Products",
          targetTable: {
            id: "tbl_products",
            name: "products",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_org_products",
              sourceColumnName: "id",
              targetColumnName: "organisation_id",
            },
          ],
        },
        {
          id: "rel_org_orders",
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
              id: "map_org_orders",
              sourceColumnName: "id",
              targetColumnName: "organisation_id",
            },
          ],
        },
        {
          id: "rel_org_reviews",
          name: "Reviews",
          targetTable: {
            id: "tbl_reviews",
            name: "reviews",
            access: "JOINABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_org_reviews",
              sourceColumnName: "id",
              targetColumnName: "organisation_id",
            },
          ],
        },
      ],
      contextPrompt:
        "Each organisation isolates tenant-specific usage data. Join through organisation_id when working across tables.",
    },
    tbl_users: {
      id: "tbl_users",
      name: "users",
      description: "Profiles for shoppers that have interacted with storefronts.",
      access: "QUERYABLE",
      columns: [
        {
          id: "user_1",
          name: "id",
          rename: "customer_id",
          type: "int",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "user_2",
          name: "organisation_id",
          type: "int",
          selected: true,
        },
        {
          id: "user_3",
          name: "name",
          type: "text",
          selected: true,
        },
        {
          id: "user_4",
          name: "email",
          type: "text",
          selected: true,
        },
        {
          id: "user_5",
          name: "city",
          type: "text",
          selected: true,
        },
        {
          id: "user_6",
          name: "zip",
          type: "text",
          selected: false,
        },
        {
          id: "user_7",
          name: "latitude",
          type: "numeric",
          selected: false,
        },
        {
          id: "user_8",
          name: "longitude",
          type: "numeric",
          selected: false,
        },
        {
          id: "user_9",
          name: "birth_date",
          type: "date",
          selected: false,
        },
        {
          id: "user_10",
          name: "created_at",
          type: "timestamp",
          selected: false,
        },
        {
          id: "user_11",
          name: "last_order_at",
          type: "timestamp",
          selected: false,
        },
      ],
      computedColumns: [
        {
          id: "cc_user_1",
          name: "orders_count",
          expression: "count(orders.id)",
          selected: true,
          type: "int",
        },
        {
          id: "cc_user_2",
          name: "lifetime_value",
          expression: "sum(orders.subtotal + orders.tax - orders.discount)",
          selected: false,
          type: "numeric",
          unit: "USD",
        },
      ],
      outwardRelations: [
        {
          id: "rel_user_org",
          name: "Organisation",
          targetTable: {
            id: "tbl_organisations",
            name: "organisations",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_user_org",
              sourceColumnName: "organisation_id",
              targetColumnName: "id",
            },
          ],
        },
        {
          id: "rel_user_orders",
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
              id: "map_user_orders",
              sourceColumnName: "id",
              targetColumnName: "user_id",
            },
          ],
        },
        {
          id: "rel_user_reviews",
          name: "Reviews",
          targetTable: {
            id: "tbl_reviews",
            name: "reviews",
            access: "JOINABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_user_reviews",
              sourceColumnName: "id",
              targetColumnName: "user_id",
            },
          ],
        },
      ],
      contextPrompt:
        "Use this table for customer segmentation and engagement analytics.",
    },
    tbl_products: {
      id: "tbl_products",
      name: "products",
      description:
        "Catalog entries enriched with merchandising metadata and stock levels.",
      access: "QUERYABLE",
      columns: [
        {
          id: "prod_1",
          name: "id",
          type: "int",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "prod_2",
          name: "organisation_id",
          type: "int",
          selected: true,
        },
        {
          id: "prod_3",
          name: "title",
          type: "text",
          selected: true,
        },
        {
          id: "prod_4",
          name: "category",
          type: "text",
          selected: true,
        },
        {
          id: "prod_5",
          name: "ean",
          type: "text",
          selected: false,
        },
        {
          id: "prod_6",
          name: "price",
          type: "numeric",
          unit: "USD",
          selected: true,
        },
        {
          id: "prod_7",
          name: "stock_level",
          type: "int",
          selected: true,
        },
        {
          id: "prod_8",
          name: "created_at",
          type: "timestamp",
          selected: false,
        },
      ],
      computedColumns: [
        {
          id: "cc_prod_1",
          name: "inventory_value",
          expression: "price * stock_level",
          selected: true,
          type: "numeric",
          unit: "USD",
        },
      ],
      outwardRelations: [
        {
          id: "rel_prod_org",
          name: "Organisation",
          targetTable: {
            id: "tbl_organisations",
            name: "organisations",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_prod_org",
              sourceColumnName: "organisation_id",
              targetColumnName: "id",
            },
          ],
        },
        {
          id: "rel_prod_orders",
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
              id: "map_prod_orders",
              sourceColumnName: "id",
              targetColumnName: "product_id",
            },
          ],
        },
        {
          id: "rel_prod_reviews",
          name: "Reviews",
          targetTable: {
            id: "tbl_reviews",
            name: "reviews",
            access: "JOINABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: true,
          columnMappings: [
            {
              id: "map_prod_reviews",
              sourceColumnName: "id",
              targetColumnName: "product_id",
            },
          ],
        },
      ],
      contextPrompt:
        "Blend catalog data with order lines to understand product performance.",
    },
    tbl_orders: {
      id: "tbl_orders",
      name: "orders",
      description: "Transactional headers for store purchases.",
      access: "QUERYABLE",
      columns: [
        {
          id: "order_1",
          name: "id",
          rename: "order_id",
          type: "int",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "order_2",
          name: "organisation_id",
          type: "int",
          selected: true,
        },
        {
          id: "order_3",
          name: "user_id",
          type: "int",
          selected: true,
        },
        {
          id: "order_4",
          name: "product_id",
          type: "int",
          selected: true,
        },
        {
          id: "order_5",
          name: "subtotal",
          type: "numeric",
          unit: "USD",
          selected: true,
        },
        {
          id: "order_6",
          name: "tax",
          type: "numeric",
          unit: "USD",
          selected: true,
        },
        {
          id: "order_7",
          name: "discount",
          type: "numeric",
          unit: "USD",
          selected: true,
        },
        {
          id: "order_8",
          name: "quantity",
          type: "int",
          selected: true,
        },
        {
          id: "order_9",
          name: "created_at",
          type: "timestamp",
          selected: true,
        },
      ],
      computedColumns: [
        {
          id: "cc_order_1",
          name: "order_total",
          expression: "subtotal + tax - discount",
          selected: true,
          type: "numeric",
          unit: "USD",
        },
        {
          id: "cc_order_2",
          name: "net_margin",
          expression: "(subtotal - discount) - cost_basis",
          selected: false,
          type: "numeric",
          notes: "Requires cost feed",
        },
      ],
      outwardRelations: [
        {
          id: "rel_order_org",
          name: "Organisation",
          targetTable: {
            id: "tbl_organisations",
            name: "organisations",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_order_org",
              sourceColumnName: "organisation_id",
              targetColumnName: "id",
            },
          ],
        },
        {
          id: "rel_order_user",
          name: "User",
          targetTable: {
            id: "tbl_users",
            name: "users",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_order_user",
              sourceColumnName: "user_id",
              targetColumnName: "id",
            },
          ],
        },
        {
          id: "rel_order_product",
          name: "Product",
          targetTable: {
            id: "tbl_products",
            name: "products",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_order_product",
              sourceColumnName: "product_id",
              targetColumnName: "id",
            },
          ],
        },
      ],
      contextPrompt:
        "Orders combine financials with user + product relations for downstream metrics.",
    },
    tbl_reviews: {
      id: "tbl_reviews",
      name: "reviews",
      description: "Post-purchase review submissions for each order line.",
      access: "JOINABLE",
      columns: [
        {
          id: "rev_1",
          name: "id",
          type: "int",
          selected: true,
          notes: "Primary key",
        },
        {
          id: "rev_2",
          name: "organisation_id",
          type: "int",
          selected: true,
        },
        {
          id: "rev_3",
          name: "product_id",
          type: "int",
          selected: true,
        },
        {
          id: "rev_4",
          name: "user_id",
          type: "int",
          selected: true,
        },
        {
          id: "rev_5",
          name: "rating",
          type: "smallint",
          selected: true,
        },
        {
          id: "rev_6",
          name: "comment",
          type: "text",
          selected: false,
        },
        {
          id: "rev_7",
          name: "created_at",
          type: "timestamp",
          selected: true,
        },
      ],
      computedColumns: [
        {
          id: "cc_rev_1",
          name: "sentiment_score",
          expression: "sentiment_ml(comment)",
          selected: false,
          type: "numeric",
        },
      ],
      outwardRelations: [
        {
          id: "rel_rev_org",
          name: "Organisation",
          targetTable: {
            id: "tbl_organisations",
            name: "organisations",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_rev_org",
              sourceColumnName: "organisation_id",
              targetColumnName: "id",
            },
          ],
        },
        {
          id: "rel_rev_user",
          name: "User",
          targetTable: {
            id: "tbl_users",
            name: "users",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_rev_user",
              sourceColumnName: "user_id",
              targetColumnName: "id",
            },
          ],
        },
        {
          id: "rel_rev_product",
          name: "Product",
          targetTable: {
            id: "tbl_products",
            name: "products",
            access: "QUERYABLE",
          },
          selected: true,
          status: "VALID",
          source: "SYNCED",
          isList: false,
          columnMappings: [
            {
              id: "map_rev_product",
              sourceColumnName: "product_id",
              targetColumnName: "id",
            },
          ],
        },
      ],
      contextPrompt:
        "Join reviews when you need qualitative feedback in analytics outputs.",
    },
  },
};

type DatabaseViewerColumn = {
  field: string;
  label?: string;
  unit?: string;
};

type DatabaseViewerDefinition = {
  id: string;
  tableName: DatabaseTableName;
  columns: DatabaseViewerColumn[];
};

const DATABASE_VIEWER_TABLES: DatabaseViewerDefinition[] = [
  {
    id: "tbl_organisations",
    tableName: "organisations",
    columns: [
      { field: "id" },
      { field: "name" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_users",
    tableName: "users",
    columns: [
      { field: "id", label: "customer_id" },
      { field: "organisation_id" },
      { field: "name" },
      { field: "email" },
      { field: "city" },
      { field: "created_at" },
      { field: "last_order_at" },
    ],
  },
  {
    id: "tbl_products",
    tableName: "products",
    columns: [
      { field: "id" },
      { field: "organisation_id" },
      { field: "title" },
      { field: "category" },
      { field: "price", unit: "USD" },
      { field: "stock_level" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_orders",
    tableName: "orders",
    columns: [
      { field: "id", label: "order_id" },
      { field: "organisation_id" },
      { field: "user_id" },
      { field: "product_id" },
      { field: "subtotal", unit: "USD" },
      { field: "tax", unit: "USD" },
      { field: "discount", unit: "USD" },
      { field: "quantity" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_reviews",
    tableName: "reviews",
    columns: [
      { field: "id" },
      { field: "organisation_id" },
      { field: "product_id" },
      { field: "user_id" },
      { field: "rating" },
      { field: "comment" },
      { field: "created_at" },
    ],
  },
];

const DATABASE_VIEWER_MAP = DATABASE_VIEWER_TABLES.reduce<
  Record<string, DatabaseViewerDefinition>
>((acc, table) => {
  acc[table.id] = table;
  return acc;
}, {});

const DATABASE_VIEWER_TABLE_WIDTH = 640;

const ORDERED_TABLES = DATABASE_FIXTURE.summary.tableIds
  .map(({ id }) => DATABASE_FIXTURE.tables[id])
  .filter((table): table is TableSchema => Boolean(table));

const DEFAULT_TABLE_ID =
  DATABASE_VIEWER_TABLES[0]?.id ?? ORDERED_TABLES[0]?.id ?? null;

export default function HomePage() {
  const [topHeight, setTopHeight] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [focusedTableId, setFocusedTableId] = useState<string | null>(
    DEFAULT_TABLE_ID,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedTable =
    focusedTableId && DATABASE_FIXTURE.tables[focusedTableId]
      ? DATABASE_FIXTURE.tables[focusedTableId]
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
          <Container size="xl" py="lg" style={{ height: "calc(100vh - 2rem)" }}>
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
          </Container>
        </main>
      </MantineProvider>
    </Assistant>
  );
}

type SemanticTableViewProps = {
  table: TableSchema | null;
};

function SemanticTableView({ table }: SemanticTableViewProps) {
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const [relationActiveExpanded, setRelationActiveExpanded] = useState(true);
  const [relationInactiveExpanded, setRelationInactiveExpanded] =
    useState(false);
  const [relationDisabledExpanded, setRelationDisabledExpanded] =
    useState(false);

  useEffect(() => {
    setActiveExpanded(true);
    setInactiveExpanded(false);
    setRelationActiveExpanded(true);
    setRelationInactiveExpanded(false);
    setRelationDisabledExpanded(false);
  }, [table?.id]);

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
    <div className="flex flex-col gap-4">
      <Title order={3}>Semantic Model</Title>
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Text fw={600} tt="lowercase">
              {table.name}
            </Text>
            {table.description && (
              <Text fz="sm" c="dimmed">
                {table.description}
              </Text>
            )}
            {table.condition && (
              <Text fz="xs" c="dimmed" mt={4}>
                (where {table.condition.column.name} = requestContext.
                {table.condition.requestContextField.key})
              </Text>
            )}
          </Box>
          <Badge
            color={tableAccessLabels[table.access].color}
            variant="light"
          >
            {tableAccessLabels[table.access].label}
          </Badge>
        </Group>

        <Box mt="md">
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

        <Box mt="md">
          <Badge color="blue" size="sm">
            Where condition
          </Badge>
          <Code block mt="xs">
            {table.condition ? (
              <Text fz="sm">
                Where {table.name}.{table.condition.column.name} =
                requestContext.{table.condition.requestContextField.key}
              </Text>
            ) : (
              <Text fz="sm" c="dimmed">
                No row-level filter configured.
              </Text>
            )}
          </Code>
        </Box>

        <Box mt="md">
          <Badge color="violet" size="sm">
            Relations
          </Badge>
          <RelationsTable
            title="Active relations"
            relations={activeRelations}
            isOpen={relationActiveExpanded}
            toggle={() => setRelationActiveExpanded((value) => !value)}
          />
          <RelationsTable
            title="Inactive relations"
            relations={inactiveRelations}
            isOpen={relationInactiveExpanded}
            toggle={() => setRelationInactiveExpanded((value) => !value)}
            muted
          />
          <RelationsTable
            title="Disabled relations"
            relations={disabledRelations}
            isOpen={relationDisabledExpanded}
            toggle={() => setRelationDisabledExpanded((value) => !value)}
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
              {table.contextPrompt ?? "No custom table prompt configured."}
            </Text>
          </Card>
        </Box>
      </Card>
    </div>
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

type DatabaseSelectorProps = {
  activeTableId: string | null;
  onSelect: (tableId: string) => void;
};

function DatabaseSelector({
  activeTableId,
  onSelect,
}: DatabaseSelectorProps) {
  const fallbackId = DATABASE_VIEWER_TABLES[0]?.id ?? null;
  const value =
    activeTableId && DATABASE_VIEWER_MAP[activeTableId]
      ? activeTableId
      : fallbackId;

  if (!value) {
    return null;
  }

  const segments = DATABASE_VIEWER_TABLES.map((table) => ({
    value: table.id,
    label: (
      <Text fw={600} fz="xs" tt="lowercase">
        {DATABASE_FIXTURE.tables[table.id]?.name ?? table.id}
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

function DatabaseViewer({
  activeTableId,
}: DatabaseViewerProps) {
  const fallbackTableId = DATABASE_VIEWER_TABLES[0]?.id ?? null;
  const selectedTableId =
    activeTableId && DATABASE_VIEWER_MAP[activeTableId]
      ? activeTableId
      : fallbackTableId;

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

  const selectedSource = selectedTableId
    ? DATABASE_VIEWER_MAP[selectedTableId]
    : undefined;
  const selectedMetadata =
    selectedTableId && DATABASE_FIXTURE.tables[selectedTableId]
      ? DATABASE_FIXTURE.tables[selectedTableId]
      : null;

  const isTableDisabled = selectedMetadata?.access === "OFF";

  useEffect(() => {
    if (!selectedSource || !selectedTableId || isTableDisabled) {
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
      table: selectedSource.tableName,
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
    selectedSource,
    selectedTableId,
    page,
    pageSize,
    isTableDisabled,
  ]);

  useEffect(() => {
    setPage((current) => {
      const maxPage = Math.max(1, queryState.totalPages);
      return current > maxPage ? maxPage : current;
    });
  }, [queryState.totalPages]);

  if (!selectedTableId || !selectedSource) {
    return (
      <Card withBorder radius="md" mt="md" p="md">
        <Text fz="sm" c="dimmed">
          No tables are configured for this workspace yet.
        </Text>
      </Card>
    );
  }

  const columnsToDisplay = selectedSource.columns;
  const rows = queryState.rows;
  const isLoading = queryState.status === "loading";
  const isError = queryState.status === "error";
  const showEmptyState =
    queryState.status === "success" && rows.length === 0;

  return (
    <Box mt="md">
      {isTableDisabled && (
        <Card withBorder radius="md" mt="sm" bg="gray.0">
          <Group gap="xs" align="flex-start">
            <IconInfoCircle size={16} />
            <Text fz="sm">
              Access for this table is disabled in the demo. Data explorer is
              read-only.
            </Text>
          </Group>
        </Card>
      )}

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
                <Table.Tr key={`${selectedTableId}-${rowIndex}`}>
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
  column?: DatabaseViewerColumn,
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
