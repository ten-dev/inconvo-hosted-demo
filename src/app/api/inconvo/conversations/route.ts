import Inconvo from "@inconvoai/node";
import type { ConversationCreateParams } from "@inconvoai/node/resources/conversations";
import { NextResponse } from "next/server";

export const runtime = "edge";

const inconvo = new Inconvo({
  apiKey: process.env.INCONVO_API_KEY,
  baseURL:
    process.env.INCONVO_API_BASE_URL ??
    process.env.INCONVO_BASE_URL ??
    undefined,
});

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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      organisationId?: number | string | null;
    };

    const organisationId = parseOrganisationId(body.organisationId);
    const params: ConversationCreateParams = {
      context: {},
    };
    if (organisationId !== null) {
      params.context.organisationId = organisationId;
    }

    const conversation = await inconvo.conversations.create(params);

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
        await inconvo.conversations.retrieve(conversationId);
      return NextResponse.json(conversation);
    }

    const listParams =
      organisationId === null
        ? { limit: 50 }
        : { limit: 50, context: { organisationId } };
    const conversations = await inconvo.conversations.list(listParams);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Failed to retrieve conversations:", error);
    return NextResponse.json(
      { error: "Failed to retrieve conversations" },
      { status: 500 },
    );
  }
}
