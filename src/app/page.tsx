"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { useCallback, useEffect, useState } from "react";
import NextImage from "next/image";
import posthog from "posthog-js";
import {
  Box,
  Button,
  Card,
  Group,
  MantineProvider,
  Title,
  rem,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

import { Assistant } from "./assistant";
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
              <Box mb="md">
                <Group justify="space-between" align="center" mb={rem(8)}>
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
                      Demo: Inconvo data agent integrated with in-app assistant
                    </Title>
                  </Group>
                  <Box style={{ textAlign: "right" }}>
                    <Button
                      component="a"
                      href="https://app.inconvo.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="filled"
                      size="sm"
                    >
                      Build your own data agent
                    </Button>
                    <div
                      style={{
                        fontSize: rem(11),
                        color: "var(--mantine-color-dimmed)",
                        marginTop: rem(4),
                      }}
                    >
                      (Start free, no credit card required)
                    </div>
                  </Box>
                </Group>
              </Box>
              <Card
                withBorder
                shadow="sm"
                radius="lg"
                p="xl"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Title
                  order={1}
                  style={{
                    fontSize: rem(72),
                    fontWeight: 900,
                    textAlign: "center",
                    color: "var(--mantine-color-gray-4)",
                  }}
                >
                  Your Application Here
                </Title>
              </Card>

              <Box
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
              </Box>
            </Box>
          </main>
        </Assistant>
      </ModalsProvider>
    </MantineProvider>
  );
}
