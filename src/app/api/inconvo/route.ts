import Inconvo from "@inconvoai/node";
import { NextResponse } from "next/server";

const inconvo = new Inconvo({
  apiKey: process.env.INCONVO_API_KEY,
  baseURL:
    process.env.INCONVO_API_BASE_URL ??
    process.env.INCONVO_BASE_URL ??
    undefined,
});

export async function POST(req: Request) {
  const {
    message,
    conversationId,
  }: {
    message?: string;
    conversationId?: string;
  } = await req.json();

  if (!conversationId || typeof message !== "string") {
    return NextResponse.json(
      { error: "conversationId and message are required" },
      { status: 400 }
    );
  }

  try {
    const sseStream = inconvo.conversations.response.create(conversationId, {
      message,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of sseStream) {
            controller.enqueue(
              new TextEncoder().encode(JSON.stringify(event) + "\n")
            );

            if (event.type === "response.completed") {
              controller.close();
              return;
            }

            if ((event as { type: string }).type === "error") {
              controller.close();
              return;
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Inconvo API error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
