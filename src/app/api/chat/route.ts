import { azure } from "@ai-sdk/azure";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { inconvoTools } from "@inconvoai/node-ai-sdk";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const userContext = {
    organisationId: 1,
  };

  const result = streamText({
    model: azure("gpt-5.1-chat"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    system,
    tools: {
      ...frontendTools(tools),
      ...inconvoTools({
        userContext,
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
