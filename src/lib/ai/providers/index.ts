import { getSystemSettings } from "@/lib/config";
import {
  AIProvider,
  ChatMessage,
  GenerateOptions,
  ProviderConnectionTestResult,
} from "../types";
import {
  simulateCopilotChatStream,
  simulateStreamText,
  simulateCourseOutline,
  simulateLessonContent,
  simulateBlogPost,
  simulateSEOMetadata,
  simulateQuiz,
} from "../mock-proxy";
import {
  PROVIDER_ENDPOINTS,
  streamOpenAICompatible,
  generateOpenAICompatibleText,
} from "./openai-compatible";
import { streamClaude, generateClaudeText } from "./claude";
import { streamGemini, generateGeminiText } from "./gemini";
import {
  isDevEnvironment,
  isDevBridgeRunning,
  enqueueDevTask,
  streamDevTask,
  waitForDevTask,
} from "../dev-bridge";

/**
 * Resolve provider API Key from options, settings, or environment
 */
async function resolveProviderConfig(
  requestedProvider?: AIProvider,
  explicitKey?: string
) {
  const settings = await getSystemSettings();
  const provider: AIProvider =
    requestedProvider || settings.aiDefaultProvider || "gemini";

  let apiKey = explicitKey || "";

  if (!apiKey) {
    switch (provider) {
      case "gemini":
        apiKey = settings.aiGeminiKey || process.env.GEMINI_API_KEY || "";
        break;
      case "openai":
        apiKey = settings.aiOpenaiKey || process.env.OPENAI_API_KEY || "";
        break;
      case "claude":
        apiKey = settings.aiClaudeKey || process.env.ANTHROPIC_API_KEY || "";
        break;
      case "deepseek":
        apiKey = settings.aiDeepseekKey || process.env.DEEPSEEK_API_KEY || "";
        break;
      case "glm":
        apiKey = settings.aiGlmKey || process.env.GLM_API_KEY || "";
        break;
      case "moonshot":
        apiKey = settings.aiMoonshotKey || process.env.MOONSHOT_API_KEY || "";
        break;
    }
  }

  const isMock =
    settings.aiDevMockEnabled ||
    !apiKey ||
    apiKey === "mock" ||
    process.env.APP_ENV === "development" && !apiKey;

  return {
    provider,
    apiKey,
    defaultModel: settings.aiDefaultModel,
    isMock,
    temperature: settings.aiTemperature,
    maxTokens: settings.aiMaxTokens,
  };
}

/**
 * Universal Streaming Chat Generator
 */
export async function* streamChat(
  messages: ChatMessage[],
  options?: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const config = await resolveProviderConfig(options?.provider, options?.apiKey);

  // If mock mode is explicitly forced or active
  if (options?.devMockEnabled ?? config.isMock) {
    // If in dev environment and Dev AI Bridge Worker is active
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("chat", {
          messages,
          contextDocs: options?.contextDocs,
        });
        for await (const chunk of streamDevTask(taskId)) {
          yield chunk;
        }
        return;
      } catch (err) {
        console.warn("Dev AI Bridge stream error, falling back to mock:", err);
      }
    }

    for await (const chunk of simulateCopilotChatStream(messages, options?.contextDocs)) {
      yield chunk;
    }
    return;
  }

  // Real LLM API Dispatch
  switch (config.provider) {
    case "gemini":
      yield* streamGemini(
        messages,
        { apiKey: config.apiKey, defaultModel: config.defaultModel },
        options
      );
      break;

    case "claude":
      yield* streamClaude(
        messages,
        { apiKey: config.apiKey, defaultModel: config.defaultModel },
        options
      );
      break;

    case "openai":
    case "deepseek":
    case "glm":
    case "moonshot": {
      const endpoint = PROVIDER_ENDPOINTS[config.provider];
      yield* streamOpenAICompatible(
        messages,
        {
          baseUrl: endpoint.baseUrl,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || endpoint.defaultModel,
        },
        options
      );
      break;
    }

    default:
      for await (const chunk of simulateCopilotChatStream(messages, options?.contextDocs)) {
        yield chunk;
      }
  }
}

/**
 * Universal Non-streaming Text Generator
 */
export async function generateText(
  messages: ChatMessage[],
  options?: GenerateOptions
): Promise<string> {
  const config = await resolveProviderConfig(options?.provider, options?.apiKey);

  if (options?.devMockEnabled ?? config.isMock) {
    if (isDevEnvironment() && isDevBridgeRunning()) {
      try {
        const taskId = enqueueDevTask("chat", {
          messages,
          contextDocs: options?.contextDocs,
        });
        return await waitForDevTask(taskId);
      } catch (err) {
        console.warn("Dev AI Bridge task error, falling back to mock:", err);
      }
    }

    let result = "";
    for await (const chunk of simulateCopilotChatStream(messages, options?.contextDocs)) {
      result += chunk;
    }
    return result;
  }

  switch (config.provider) {
    case "gemini":
      return generateGeminiText(
        messages,
        { apiKey: config.apiKey, defaultModel: config.defaultModel },
        options
      );

    case "claude":
      return generateClaudeText(
        messages,
        { apiKey: config.apiKey, defaultModel: config.defaultModel },
        options
      );

    case "openai":
    case "deepseek":
    case "glm":
    case "moonshot": {
      const endpoint = PROVIDER_ENDPOINTS[config.provider];
      return generateOpenAICompatibleText(
        messages,
        {
          baseUrl: endpoint.baseUrl,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || endpoint.defaultModel,
        },
        options
      );
    }

    default:
      return "Mock provider output";
  }
}

/**
 * Test Provider Connection
 */
export async function testProviderConnection(
  provider: AIProvider,
  apiKey?: string,
  model?: string,
  devMockEnabled?: boolean
): Promise<ProviderConnectionTestResult> {
  if (devMockEnabled) {
    return {
      success: true,
      provider,
      message: `Chế độ Local Dev Mock Proxy hoạt động tốt (${provider.toUpperCase()})`,
    };
  }

  if (!apiKey) {
    return {
      success: false,
      provider,
      error: "Khóa API không được để trống khi tắt chế độ Mock.",
    };
  }

  try {
    const testMessages: ChatMessage[] = [
      { role: "user", content: "Reply with 'OK' only." },
    ];

    const result = await generateText(testMessages, {
      provider,
      apiKey,
      model,
      devMockEnabled: false,
      maxTokens: 10,
    });

    return {
      success: true,
      provider,
      message: `Kết nối thành công tới ${provider.toUpperCase()} (${result.trim()})`,
    };
  } catch (error: any) {
    return {
      success: false,
      provider,
      error: error.message || "Kết nối thất bại.",
    };
  }
}
