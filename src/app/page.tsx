"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { useCallback, useEffect, useState } from "react";
import NextImage from "next/image";
import posthog from "posthog-js";
import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react";
import {
  Box,
  Button,
  Card,
  Group,
  MantineProvider,
  Title,
  Text,
  SegmentedControl,
  rem,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

import { Assistant } from "./assistant";
import { DatabaseViewer } from "~/components/database-viewer";
import type {
  OrganisationLoadState,
  OrganisationOption,
  OrganisationSelectorProps,
} from "~/components/organisation/organisation-selector";

type OrganisationsApiResponse = {
  rows?: Array<Record<string, unknown>>;
  error?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export default function HomePage() {
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
  const [activeView, setActiveView] = useState<"info" | "data">("info");

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

        const payload: OrganisationsApiResponse = await response.json();
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
      // Track organisation switch event
      posthog.capture("organisation_switched", {
        previous_organisation_id: current,
        new_organisation_id: value,
      });
      return value;
    });
  }, []);

  const organisationSelectorProps: OrganisationSelectorProps = {
    options: organisations,
    value: selectedOrganisationId,
    status: organisationStatus,
    error: organisationError,
    onChange: handleOrganisationChange,
  };

  return (
    <MantineProvider defaultColorScheme="light">
      <ModalsProvider>
        <Notifications />
        <Assistant
          key={`assistant-${threadResetKey}`}
          organisationId={selectedOrganisationId}
          organisationSelectorProps={organisationSelectorProps}
        >
          <main className="bg-background text-foreground flex min-h-screen flex-col">
            <Box
              component="section"
              style={{
                width: "100%",
                maxWidth: "100%",
                paddingTop: rem(24),
                paddingBottom: rem(24),
                paddingLeft: rem(32),
                paddingRight: rem(32),
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* View Switcher */}
              <Box mb="lg">
                <SegmentedControl
                  value={activeView}
                  onChange={(value) => setActiveView(value as "info" | "data")}
                  data={[
                    { label: "Demo Info", value: "info" },
                    { label: "Connected Data", value: "data" },
                  ]}
                  size="md"
                  radius="md"
                  fullWidth
                />
              </Box>

              {activeView === "info" && (
                <>
              {/* Orientation Header */}
              <Box mb={rem(32)}>
                <Box mb={rem(32)}>
                  <Title
                    order={1}
                    style={{
                      fontWeight: 700,
                      marginBottom: rem(16),
                      fontSize: rem(36),
                      lineHeight: 1.2,
                    }}
                  >
                    Live demo: an in-app assistant built with Inconvo
                  </Title>
                  <Box style={{ maxWidth: "700px" }}>
                    <Text
                      size="lg"
                      c="dimmed"
                      style={{ marginBottom: rem(12), lineHeight: 1.6 }}
                    >
                      This demo shows how Inconvo is used to build an AI-powered
                      data agent that connects to an application database and
                      answers questions in natural language.
                    </Text>
                    <Text size="lg" c="dimmed" style={{ lineHeight: 1.6 }}>
                      It uses a multi-tenant ecommerce dataset (Apple, Tesla,
                      Logitech) to demonstrate scoped queries, data isolation,
                      and real-time charts and tables. The UI shown here is
                      example application code, not the Inconvo product UI.
                    </Text>
                  </Box>
                </Box>

                <Group gap="md" mb={rem(32)}>
                  <Button
                    component="a"
                    href="https://github.com/ten-dev/inconvo-hosted-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="md"
                    leftSection={<IconBrandGithub size={18} />}
                    rightSection={<IconExternalLink size={16} />}
                  >
                    See how this demo was built
                  </Button>
                  <Button
                    component="a"
                    href="https://app.inconvo.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="filled"
                    size="md"
                    leftSection={
                      <NextImage
                        src="/logo.png"
                        alt="Inconvo"
                        width={18}
                        height={18}
                      />
                    }
                  >
                    Build a data agent for your app
                  </Button>
                </Group>

                {/* How this demo works */}
                <Card
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    backgroundColor: "rgba(228, 240, 255, 0.4)",
                    borderColor: "var(--mantine-color-gray-3)",
                  }}
                >
                  <Title
                    order={4}
                    style={{
                      fontWeight: 500,
                      marginBottom: rem(14),
                      fontSize: rem(16),
                    }}
                  >
                    How this demo works
                  </Title>
                  <Box
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: rem(10),
                    }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        gap: rem(10),
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        style={{
                          backgroundColor: "var(--mantine-color-blue-6)",
                          color: "white",
                          borderRadius: "50%",
                          width: rem(24),
                          height: rem(24),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: rem(13),
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        1
                      </Box>
                      <Text size="sm" style={{ flex: 1, paddingTop: rem(2) }}>
                        Natural language questions are converted into verified
                        SQL using Inconvo
                      </Text>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        gap: rem(10),
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        style={{
                          backgroundColor: "var(--mantine-color-blue-6)",
                          color: "white",
                          borderRadius: "50%",
                          width: rem(24),
                          height: rem(24),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: rem(13),
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        2
                      </Box>
                      <Text size="sm" style={{ flex: 1, paddingTop: rem(2) }}>
                        Queries are automatically scoped to the selected
                        organisation (multi-tenant isolation)
                      </Text>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        gap: rem(10),
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        style={{
                          backgroundColor: "var(--mantine-color-blue-6)",
                          color: "white",
                          borderRadius: "50%",
                          width: rem(24),
                          height: rem(24),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: rem(13),
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        3
                      </Box>
                      <Text size="sm" style={{ flex: 1, paddingTop: rem(2) }}>
                        The app renders structured results as tables and charts
                      </Text>
                    </Box>
                  </Box>
                </Card>
              </Box>
              </>
              )}

              {activeView === "data" && (
                <Card
                  withBorder
                  shadow="sm"
                  radius="lg"
                  p="xl"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Title order={3} mb="md">
                    Connected Database
                  </Title>
                  <DatabaseViewer />
                </Card>
              )}

              {/* <Box
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--mantine-color-blue-6)",
                  color: "white",
                  padding: `${rem(12)} ${rem(32)}`,
                  textAlign: "center",
                  fontSize: rem(14),
                  zIndex: 1000,
                }}
              >
                This is a demo of a data agent built with Inconvo and integrated
                with an in-app assistant.{" "}
                <strong>This is not the Inconvo platform.</strong> Want to try
                the platform for free? (No credit card required){" "}
                <a
                  href="https://app.inconvo.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "white",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Click here
                </a>
                .
              </Box> */}
            </Box>
          </main>
        </Assistant>
      </ModalsProvider>
    </MantineProvider>
  );
}
