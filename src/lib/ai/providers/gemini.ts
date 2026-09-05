import { ChatMessage, GenerateOptions } from "../types";

export interface GeminiConfig {
  apiKey: string;
  defaultModel: string;
}

/**
 * Call Google Gemini API (via official v1beta OpenAI-compatible chat endpoint) with Streaming
 */
export async function* streamGemini(
  messages: ChatMessage[],
  config: GeminiConfig,
  options?: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const model = options?.model || config.defaultModel || "gemini-2.0-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error [${response.status}]: ${errorText}`);
  }

  if (!response.body) {
    throw new Error("Empty response stream from Gemini API");
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
      if (trimmed === "data: [DONE]") return;

      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch {
          // Incomplete chunk
        }
      }
    }
  }
}

/**
 * Non-streaming call to Google Gemini API
 */
export async function generateGeminiText(
  messages: ChatMessage[],
  config: GeminiConfig,
  options?: GenerateOptions
): Promise<string> {
  const model = options?.model || config.defaultModel || "gemini-2.0-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}
