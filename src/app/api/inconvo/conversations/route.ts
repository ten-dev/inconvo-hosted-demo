import Inconvo from "@inconvoai/node";
import type { ConversationCreateParams } from "@inconvoai/node/resources/agents/conversations/conversations";
import { NextResponse } from "next/server";

const inconvo = new Inconvo({
  apiKey: process.env.INCONVO_API_KEY,
  baseURL:
    process.env.INCONVO_API_BASE_URL ??
    process.env.INCONVO_BASE_URL ??
    undefined,
});

const AGENT_ID = process.env.INCONVO_AGENT_ID ?? "";

const parseOrganisationId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const parseUserIdentifier = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      organisationId?: number | string | null;
      userIdentifier?: string | null;
    };

    const organisationId = parseOrganisationId(body.organisationId);
    const userIdentifier =
      parseUserIdentifier(body.userIdentifier) ?? `demo_user_${crypto.randomUUID()}`;

    const params: ConversationCreateParams = {
      userIdentifier,
    };
    if (organisationId !== null) {
      params.userContext = { organisationId };
    }

    const conversation = await inconvo.agents.conversations.create(AGENT_ID, params);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      {
        error: "Failed to create conversation",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");
  const organisationId = parseOrganisationId(
    searchParams.get("organisationId"),
  );

  try {
    if (conversationId) {
      const conversation =
        await inconvo.agents.conversations.retrieve(conversationId, {
          agentId: AGENT_ID,
        });
      return NextResponse.json(conversation);
    }

    const listParams =
      organisationId === null
        ? { limit: 50 }
        : { limit: 50, userContext: { organisationId } };
    const conversations = await inconvo.agents.conversations.list(AGENT_ID, listParams);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Failed to retrieve conversations:", error);
    return NextResponse.json(
      { error: "Failed to retrieve conversations" },
      { status: 500 },
    );
  }
}
