import { ChatMessage, GenerateOptions } from "../types";

export interface ClaudeConfig {
  apiKey: string;
  defaultModel: string;
}

/**
 * Call Anthropic Claude Messages API with Streaming
 */
export async function* streamClaude(
  messages: ChatMessage[],
  config: ClaudeConfig,
  options?: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const model = options?.model || config.defaultModel || "claude-3-5-sonnet-latest";

  // Anthropic separates system prompt from conversation messages
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API Error [${response.status}]: ${errorText}`);
  }

  if (!response.body) {
    throw new Error("Empty response stream from Claude API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === "content_block_delta" && json.delta?.text) {
            yield json.delta.text;
          }
        } catch {
          // Incomplete chunk
        }
      }
    }
  }
}

/**
 * Non-streaming call to Claude Messages API
 */
export async function generateClaudeText(
  messages: ChatMessage[],
  config: ClaudeConfig,
  options?: GenerateOptions
): Promise<string> {
  const model = options?.model || config.defaultModel || "claude-3-5-sonnet-latest";
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API Error [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  return json.content?.[0]?.text || "";
}
