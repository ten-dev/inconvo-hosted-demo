import { azure } from "@ai-sdk/azure";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { inconvoTools } from "@inconvoai/node-ai-sdk";

export const maxDuration = 30;

type ChatRequestPayload = {
  messages?: unknown;
  system?: unknown;
  tools?: unknown;
  userContext?: {
    organisationId?: number | string;
  };
  metadata?: {
    organisationId?: number | string;
  };
};

const parseOrganisationId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequestPayload;
  const {
    messages,
    system,
    tools,
    userContext: incomingUserContext,
    metadata,
  } = body ?? {};

  const modelMessages = convertToModelMessages(
    (Array.isArray(messages) ? messages : []) as Parameters<
      typeof convertToModelMessages
    >[0],
  );

  const systemPrompt = typeof system === "string" ? system : undefined;

  const frontendToolConfig = frontendTools(
    (tools && typeof tools === "object" ? tools : {}) as Parameters<
      typeof frontendTools
    >[0],
  );

  const organisationId =
    parseOrganisationId(incomingUserContext?.organisationId) ??
    parseOrganisationId(metadata?.organisationId) ??
    1;

  const userContext = {
    organisationId,
  };

  const result = streamText({
    model: azure("gpt-5.1-chat"),
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    system: systemPrompt,
    tools: {
      ...frontendToolConfig,
      ...inconvoTools({
        userContext,
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
