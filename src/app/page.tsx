"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import NextImage from "next/image";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Image,
  Kbd,
  MantineProvider,
  Modal,
  Pagination,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
  rem,
  Code,
} from "@mantine/core";
import { Notifications, notifications } from "@mantine/notifications";
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
import type {
  OrganisationLoadState,
  OrganisationOption,
  OrganisationSelectorProps,
} from "~/components/organisation/organisation-selector";

const DEFAULT_TABLE_ID = SEMANTIC_TABLES[0]?.id ?? null;

type OrganisationsApiResponse = {
  rows?: Array<Record<string, unknown>>;
  error?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

const ShortcutKeys = ({
  keys,
  tone = "muted",
}: {
  keys: string[];
  tone?: "primary" | "muted";
}) => (
  <Group gap={4} wrap="nowrap" align="center">
    {keys.map((key) => (
      <Kbd
        key={`${tone}-${key}`}
        size="xs"
        style={{
          borderRadius: rem(6),
          paddingInline: rem(8),
          backgroundColor:
            tone === "primary"
              ? "rgba(255, 255, 255, 0.2)"
              : "var(--mantine-color-gray-0, #f8f9fa)",
          color:
            tone === "primary"
              ? "var(--mantine-color-white, #ffffff)"
              : "var(--mantine-color-dark-6, #212529)",
          borderColor:
            tone === "primary"
              ? "rgba(255, 255, 255, 0.6)"
              : "var(--mantine-color-gray-3, #dee2e6)",
          fontWeight: 600,
        }}
      >
        {key}
      </Kbd>
    ))}
  </Group>
);

export default function HomePage() {
  const [focusedTableId, setFocusedTableId] = useState<string | null>(
    DEFAULT_TABLE_ID,
  );
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Auto-open modal on first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("inconvo-demo-visited");
    if (!hasVisitedBefore) {
      setInfoModalOpen(true);
      setIsFirstVisit(true);
      localStorage.setItem("inconvo-demo-visited", "true");
    }
  }, []);
  const [organisations, setOrganisations] = useState<OrganisationOption[]>([]);
  const [organisationStatus, setOrganisationStatus] =
    useState<OrganisationLoadState>("loading");
  const [organisationError, setOrganisationError] = useState<string | null>(
    null,
  );
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<
    number | null
  >(null);
  const [threadResetKey, setThreadResetKey] = useState(0);
  const selectedTable =
    focusedTableId && SEMANTIC_TABLE_MAP[focusedTableId]
      ? SEMANTIC_TABLE_MAP[focusedTableId]
      : null;

  useEffect(() => {
    const controller = new AbortController();

    const loadOrganisations = async () => {
      setOrganisationStatus("loading");
      setOrganisationError(null);

      try {
        const params = new URLSearchParams({
          table: "organisations",
          page: "1",
          pageSize: "50",
        });

        const response = await fetch(`/api/database?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({
            error: response.statusText,
          }))) as OrganisationsApiResponse;
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Unable to load organisations",
          );
        }

        const payload = (await response.json()) as OrganisationsApiResponse;
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        const options = rows
          .map((row) => {
            if (!isRecord(row)) {
              return null;
            }
            const idValue = row.id;
            const parsedId =
              typeof idValue === "number"
                ? idValue
                : typeof idValue === "string"
                  ? Number.parseInt(idValue, 10)
                  : null;

            if (parsedId === null || Number.isNaN(parsedId)) {
              return null;
            }

            const name =
              typeof row.name === "string"
                ? row.name
                : `Organisation ${parsedId}`;

            return {
              id: parsedId,
              name,
            };
          })
          .filter((option): option is OrganisationOption => option !== null);

        setOrganisations(options);
        setOrganisationStatus("ready");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setOrganisations([]);
        setOrganisationStatus("error");
        setOrganisationError(
          error instanceof Error
            ? error.message
            : "Unable to load organisations",
        );
      }
    };

    void loadOrganisations();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (organisations.length === 0) {
      setSelectedOrganisationId(null);
      return;
    }

    setSelectedOrganisationId((current) => {
      if (current && organisations.some((org) => org.id === current)) {
        return current;
      }
      return organisations[0]?.id ?? null;
    });
  }, [organisations]);

  const handleOrganisationChange = useCallback((value: number | null) => {
    setSelectedOrganisationId((current) => {
      if (current === value) {
        return current;
      }
      setThreadResetKey((prev) => prev + 1);
      return value;
    });
  }, []);

  type DemoSlide = {
    title: string;
    heading: string;
    body: string[];
    imageSrc: string;
    imageAlt: string;
  };

  const demoSteps: DemoSlide[] = [
    {
      title: "The Demo Store",
      heading: "A shared online store for multiple organisations",
      body: [
        "This demo simulates three organisations (Apple, Tesla, and Logitech) each running their own store on the same platform.",
        "Every organisation generates its own products, orders, users, and reviews.",
      ],
      imageSrc: "/slide1.png",
      imageAlt:
        "Illustration representing three organisations sharing one store platform",
    },
    {
      title: "The Data Model",
      heading: "A simple relational schema",
      body: [
        "Here is the database structure: organisations at the top, connected to products, orders, users, and reviews.",
        "There's a variety of data types including text, numbers, and timestamps.",
      ],
      imageSrc: "/slide2.png",
      imageAlt: "Diagram of the relational data model the demo is built on",
    },
    {
      title: "Chat Scoped by Organisation",
      heading: "Choose an organisation to chat with it's data",
      body: [
        "Select any organisation, and the chat will only answer using that organisation's data.",
        "Everything you ask is automatically scoped to the selected tenant's data as if you were that customer of the platform.",
      ],
      imageSrc: "/slide3.png",
      imageAlt: "UI showing an organisation filter being applied",
    },
    {
      title: "Questions to SQL",
      heading: "Ask questions in natural language",
      body: [
        "Type any question about the store's data, and Inconvo safely generates the necessary SQL.",
        "The agent runs the query and returns a clear, human-readable answer — in text, chart or table format.",
      ],
      imageSrc: "/slide4.png",
      imageAlt:
        "Visualization of a natural language question generating SQL and an answer",
    },
    {
      title: "Demo Agent — Powered by Inconvo",
      heading: "Inconvo connects your data to AI, safely and reliably",
      body: [
        "Inconvo connects to your database, builds a semantic model, generates verified SQL, and logs every query.",
        "You can deploy via fully managed MCP or with directly through the API",
      ],
      imageSrc: "/slide5.png",
      imageAlt:
        "Graphic representing the Inconvo platform powering AI reporting",
    },
  ];

  const totalSteps = demoSteps.length;
  const currentStepData =
    totalSteps > 0 ? demoSteps[Math.min(currentStep, totalSteps - 1)] : null;

  const goToNextStep = useCallback(() => {
    if (totalSteps === 0) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (totalSteps === 0) {
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, [totalSteps]);

  const handleModalClose = useCallback(() => {
    // Only allow closing if it's not the first visit, or if they're on the last step
    if (isFirstVisit && currentStep < totalSteps - 1) {
      const remainingSlides = totalSteps - currentStep - 1;
      notifications.show({
        title: "Almost there!",
        message: `Please view ${remainingSlides === 1 ? "the last slide" : `the remaining ${remainingSlides} slides`} before trying the demo.`,
        color: "blue",
        autoClose: 4000,
      });
      return;
    }
    setInfoModalOpen(false);
  }, [isFirstVisit, currentStep, totalSteps]);

  useEffect(() => {
    if (!infoModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === "Escape") {
        if (isFirstVisit && currentStep < totalSteps - 1) {
          event.preventDefault();
          event.stopPropagation();
          const remainingSlides = totalSteps - currentStep - 1;
          notifications.show({
            title: "Almost there!",
            message: `Please view ${remainingSlides === 1 ? "the last slide" : `the remaining ${remainingSlides} slides`} to learn about the demo.`,
            color: "blue",
            autoClose: 4000,
          });
        }
        return;
      }

      if (!event.metaKey) {
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (currentStep >= totalSteps - 1) {
          handleModalClose();
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextStep();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousStep();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is on the modal overlay
      if (
        isFirstVisit &&
        currentStep < totalSteps - 1 &&
        target.classList.contains("mantine-Modal-overlay")
      ) {
        const remainingSlides = totalSteps - currentStep - 1;
        notifications.show({
          title: "Almost there!",
          message: `Please view ${remainingSlides === 1 ? "the last slide" : `the remaining ${remainingSlides} slides`} to learn about the demo.`,
          color: "blue",
          autoClose: 4000,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [
    currentStep,
    goToNextStep,
    goToPreviousStep,
    handleModalClose,
    infoModalOpen,
    isFirstVisit,
    totalSteps,
  ]);

  const selectedOrganisation = useMemo(() => {
    if (selectedOrganisationId === null) {
      return null;
    }
    return (
      organisations.find((org) => org.id === selectedOrganisationId) ?? null
    );
  }, [organisations, selectedOrganisationId]);

  const organisationFilterLabel = useMemo(() => {
    if (!selectedOrganisation) {
      return null;
    }
    const labelName = selectedOrganisation.name
      ? selectedOrganisation.name.toLowerCase()
      : "";
    return `scoped to organisation.id ${selectedOrganisation.id}${labelName ? ` ${labelName}` : ""}`;
  }, [selectedOrganisation]);

  const organisationSelectorProps: OrganisationSelectorProps = {
    options: organisations,
    value: selectedOrganisationId,
    status: organisationStatus,
    error: organisationError,
    onChange: handleOrganisationChange,
  };

  return (
    <MantineProvider defaultColorScheme="light">
      <Notifications />
      <Assistant
        key={`assistant-${threadResetKey}`}
        organisationId={selectedOrganisationId}
        organisationSelectorProps={organisationSelectorProps}
      >
        <Modal
          opened={infoModalOpen}
          onClose={handleModalClose}
          title={currentStepData?.title}
          size="90rem"
          centered
          radius="lg"
          padding="xl"
          closeOnClickOutside={!isFirstVisit || currentStep >= totalSteps - 1}
          closeOnEscape={!isFirstVisit || currentStep >= totalSteps - 1}
          withCloseButton={!isFirstVisit || currentStep >= totalSteps - 1}
          styles={{
            body: {
              minHeight: rem(640),
            },
            title: {
              fontSize: rem(24),
              fontWeight: 700,
            },
          }}
        >
          <Stack gap="lg">
            {currentStepData ? (
              <>
                <Box
                  style={{
                    borderRadius: rem(12),
                    overflow: "hidden",
                    backgroundColor:
                      "var(--mantine-color-gray-0, rgba(248, 249, 250, 1))",
                  }}
                >
                  <Image
                    src={currentStepData.imageSrc}
                    alt={currentStepData.imageAlt}
                    fit="contain"
                    radius="md"
                    h={rem(480)}
                    w="100%"
                    styles={{
                      root: {
                        objectPosition: "center",
                      },
                    }}
                  />
                </Box>
                <Stack gap="xs">
                  <Title order={4}>{currentStepData.heading}</Title>
                  {currentStepData.body.map((paragraph, index) => (
                    <Text
                      key={`${currentStepData.title}-paragraph-${index}`}
                      size="sm"
                      c="dimmed"
                    >
                      {paragraph}
                    </Text>
                  ))}
                </Stack>
              </>
            ) : (
              <Text size="sm" c="dimmed">
                Slide information is currently unavailable.
              </Text>
            )}

            <Group justify="space-between" align="center">
              <Stack gap={0} style={{ flexGrow: 1 }}>
                <Text size="xs" c="dimmed">
                  Slide {currentStep + 1} of {totalSteps}
                </Text>
              </Stack>
              <Group gap="xs">
                <Button
                  variant="default"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={goToPreviousStep}
                >
                  <Group gap={8} wrap="nowrap" align="center">
                    <Text size="sm" fw={600}>
                      Previous
                    </Text>
                    <ShortcutKeys keys={["⌘", "←"]} tone="muted" />
                  </Group>
                </Button>
                {currentStep < totalSteps - 1 ? (
                  <Button size="sm" onClick={goToNextStep}>
                    <Group gap={8} wrap="nowrap" align="center">
                      <Text size="sm" fw={600}>
                        Next
                      </Text>
                      <ShortcutKeys keys={["⌘", "→"]} tone="primary" />
                    </Group>
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleModalClose}>
                    <Group gap={8} wrap="nowrap" align="center">
                      <Text size="sm" fw={600}>
                        Get Started
                      </Text>
                      <ShortcutKeys keys={["⌘", "↵"]} tone="primary" />
                    </Group>
                  </Button>
                )}
              </Group>
            </Group>
          </Stack>
        </Modal>

        <main className="bg-background text-foreground flex min-h-screen flex-col pb-16">
          <Box
            component="section"
            style={{
              width: "100%",
              maxWidth: "100%",
              paddingTop: rem(24),
              paddingBottom: rem(64),
              paddingLeft: rem(32),
              paddingRight: rem(32),
            }}
          >
            <Box mb="md">
              <Group justify="space-between" align="flex-start" mb={rem(8)}>
                <Group gap="sm" align="center">
                  <NextImage
                    src="/logo.png"
                    alt="Inconvo Logo"
                    width={32}
                    height={32}
                    style={{ display: "block", flexShrink: 0 }}
                  />
                  <Title
                    order={3}
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    Inconvo Demo
                  </Title>
                </Group>
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
            <Stack gap="lg" style={{ marginBottom: rem(64) }}>
              <Card withBorder shadow="sm" radius="lg">
                <ScrollArea h={rem(420)} offsetScrollbars>
                  <SemanticTableView table={selectedTable} />
                </ScrollArea>
              </Card>

              <Card withBorder shadow="sm" radius="lg">
                <Group justify="space-between" align="center" mb="xs">
                  <Title order={6}>Database Viewer</Title>
                  {selectedOrganisationId !== null &&
                  selectedTable?.name !== "organisations" ? (
                    <Badge color="blue" variant="light">
                      {organisationFilterLabel ?? "Filtered by organisation"}
                    </Badge>
                  ) : null}
                </Group>
                <DatabaseViewer
                  activeTableId={focusedTableId}
                  organisationId={selectedOrganisationId}
                  maxHeight={300}
                />
              </Card>
            </Stack>
          </Box>
        </main>
      </Assistant>
    </MantineProvider>
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
    ...computedColumns.map((column) => ({ kind: "computed" as const, column })),
    ...columns.map((column) => ({ kind: "base" as const, column })),
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
  organisationId: number | null;
  maxHeight?: number;
};

function DatabaseViewer({
  activeTableId,
  organisationId,
  maxHeight,
}: DatabaseViewerProps) {
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
  const pageSize = 3;
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

  const shouldFilterByOrganisation =
    organisationId !== null && selectedSemanticTable?.name !== "organisations";
  const whereClause = shouldFilterByOrganisation
    ? `organisation_id = ${organisationId}`
    : undefined;

  useEffect(() => {
    setPage(1);
  }, [selectedTableId, whereClause]);

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
    if (whereClause) {
      params.set("whereClause", whereClause);
    }

    const fetchRows = async () => {
      try {
        const response = await fetch(`/api/database?${params.toString()}`, {
          signal: controller.signal,
        });

        const payload: unknown = await response
          .json()
          .catch(() => ({ error: response.statusText }));

        if (!response.ok) {
          const errorMessage =
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : "Unable to fetch database table";
          throw new Error(errorMessage);
        }

        if (!isRecord(payload)) {
          throw new Error("Unexpected response format from database API");
        }

        const rowsPayload: Record<string, unknown>[] = Array.isArray(
          payload.rows,
        )
          ? payload.rows.filter(isRecord)
          : [];

        const totalPagesValue =
          typeof payload.totalPages === "number" && payload.totalPages > 0
            ? payload.totalPages
            : 1;

        const totalCountValue =
          typeof payload.totalCount === "number" && payload.totalCount >= 0
            ? payload.totalCount
            : 0;

        setQueryState({
          status: "success",
          rows: rowsPayload,
          totalPages: totalPagesValue,
          totalCount: totalCountValue,
          error: undefined,
        });
      } catch (error) {
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
      }
    };

    void fetchRows();

    return () => controller.abort();
  }, [
    selectedSemanticTable?.id,
    selectedSemanticTable?.name,
    selectedSemanticTable,
    hasViewerConfig,
    page,
    pageSize,
    whereClause,
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
        <Box style={{ width: "100%" }}>
          <ScrollArea
            offsetScrollbars
            style={{
              width: "100%",
              maxHeight: maxHeight ? rem(maxHeight) : undefined,
            }}
          >
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
    const formatted = Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return column?.unit ? `${formatted} ${column.unit}` : formatted;
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

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[unserializable]";
    }
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "symbol") {
    return value.description ? `Symbol(${value.description})` : "Symbol()";
  }

  if (typeof value === "function") {
    return value.name ? `[fn ${value.name}]` : "[fn]";
  }

  return "";
}
