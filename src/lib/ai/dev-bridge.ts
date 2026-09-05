import fs from "fs";
import path from "path";
import { ChatMessage } from "./types";

/**
 * Dev AI Bridge - Local Development Task Queue
 * Strictly isolated for local development mode. Never executed in production.
 */

export interface DevAiTask {
  id: string;
  type: "chat" | "course_outline" | "lesson_content" | "blog_post" | "quiz" | "seo";
  prompt?: string;
  messages?: ChatMessage[];
  contextDocs?: string[];
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  result?: string;
  error?: string;
}

export interface DevBridgeHeartbeat {
  workerPid: number;
  timestamp: number;
  mode: string;
  activeProvider: string;
}

export interface DevBridgeStats {
  running: boolean;
  heartbeat: DevBridgeHeartbeat | null;
  pendingCount: number;
  completedCount: number;
}

/**
 * Check if the application is running strictly in development mode
 */
export function isDevEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.APP_ENV === "development"
  );
}

const TASKS_DIR = path.join(process.cwd(), ".dev-ai-tasks");
const QUEUE_DIR = path.join(TASKS_DIR, "queue");
const STREAMS_DIR = path.join(TASKS_DIR, "streams");
const COMPLETED_DIR = path.join(TASKS_DIR, "completed");
const HEARTBEAT_FILE = path.join(TASKS_DIR, "heartbeat.json");

/**
 * Ensure required dev task directories exist
 */
function ensureDirectories() {
  if (!isDevEnvironment()) return;
  for (const dir of [TASKS_DIR, QUEUE_DIR, STREAMS_DIR, COMPLETED_DIR]) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignore directory creation errors in edge environments
      }
    }
  }
}

/**
 * Check if the Dev Bridge background worker is actively running
 */
export function isDevBridgeRunning(): boolean {
  if (!isDevEnvironment()) return false;
  try {
    if (!fs.existsSync(HEARTBEAT_FILE)) return false;
    const content = fs.readFileSync(HEARTBEAT_FILE, "utf-8");
    const heartbeat: DevBridgeHeartbeat = JSON.parse(content);
    // Heartbeat is refreshed every 2s, considered dead if older than 6s
    return Date.now() - heartbeat.timestamp < 6000;
  } catch {
    return false;
  }
}

/**
 * Get current stats of the Dev Bridge
 */
export function getDevBridgeStats(): DevBridgeStats {
  if (!isDevEnvironment()) {
    return { running: false, heartbeat: null, pendingCount: 0, completedCount: 0 };
  }

  ensureDirectories();
  let heartbeat: DevBridgeHeartbeat | null = null;
  let running = false;

  try {
    if (fs.existsSync(HEARTBEAT_FILE)) {
      heartbeat = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, "utf-8"));
      running = !!heartbeat && Date.now() - heartbeat.timestamp < 6000;
    }
  } catch {
    // Ignore parse error
  }

  let pendingCount = 0;
  let completedCount = 0;

  try {
    if (fs.existsSync(QUEUE_DIR)) {
      pendingCount = fs.readdirSync(QUEUE_DIR).filter((f) => f.endsWith(".json")).length;
    }
    if (fs.existsSync(COMPLETED_DIR)) {
      completedCount = fs.readdirSync(COMPLETED_DIR).filter((f) => f.endsWith(".json")).length;
    }
  } catch {
    // Ignore read errors
  }

  return { running, heartbeat, pendingCount, completedCount };
}

/**
 * Enqueue a task for the Dev Bridge Worker
 */
export function enqueueDevTask(
  type: DevAiTask["type"],
  payload: {
    prompt?: string;
    messages?: ChatMessage[];
    contextDocs?: string[];
  }
): string {
  if (!isDevEnvironment()) {
    throw new Error("Dev Bridge task queue is strictly forbidden in production mode.");
  }

  ensureDirectories();
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const task: DevAiTask = {
    id,
    type,
    prompt: payload.prompt,
    messages: payload.messages,
    contextDocs: payload.contextDocs,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  const taskPath = path.join(QUEUE_DIR, `${id}.json`);
  const streamPath = path.join(STREAMS_DIR, `${id}.txt`);

  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2), "utf-8");
  fs.writeFileSync(streamPath, "", "utf-8");

  return id;
}

/**
 * Read current stream chunks and wait for completion
 */
export async function* streamDevTask(
  taskId: string,
  timeoutMs: number = 45000
): AsyncGenerator<string, string, unknown> {
  if (!isDevEnvironment()) {
    throw new Error("Dev Bridge streaming is only available in development mode.");
  }

  const streamPath = path.join(STREAMS_DIR, `${taskId}.txt`);
  const completedPath = path.join(COMPLETED_DIR, `${taskId}.json`);
  const startTime = Date.now();
  let byteOffset = 0;

  while (Date.now() - startTime < timeoutMs) {
    // Read new stream content if available
    if (fs.existsSync(streamPath)) {
      try {
        const stats = fs.statSync(streamPath);
        if (stats.size > byteOffset) {
          const buffer = Buffer.alloc(stats.size - byteOffset);
          const fd = fs.openSync(streamPath, "r");
          fs.readSync(fd, buffer, 0, buffer.length, byteOffset);
          fs.closeSync(fd);
          byteOffset = stats.size;

          const chunkText = buffer.toString("utf-8");
          if (chunkText) {
            yield chunkText;
          }
        }
      } catch {
        // Retry next tick on file lock
      }
    }

    // Check if task completed
    if (fs.existsSync(completedPath)) {
      try {
        const completedTask: DevAiTask = JSON.parse(
          fs.readFileSync(completedPath, "utf-8")
        );
        // Flush any remaining stream bytes before returning
        if (fs.existsSync(streamPath)) {
          const stats = fs.statSync(streamPath);
          if (stats.size > byteOffset) {
            const buffer = Buffer.alloc(stats.size - byteOffset);
            const fd = fs.openSync(streamPath, "r");
            fs.readSync(fd, buffer, 0, buffer.length, byteOffset);
            fs.closeSync(fd);
            const chunkText = buffer.toString("utf-8");
            if (chunkText) yield chunkText;
          }
        }

        if (completedTask.status === "FAILED") {
          throw new Error(completedTask.error || "Dev AI task failed");
        }
        return completedTask.result || "";
      } catch (err: any) {
        if (err.message && err.message.includes("Dev AI task failed")) throw err;
        // File may be currently writing, retry next tick
      }
    }

    // Sleep 50ms before polling next chunk
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Dev AI Bridge timed out after ${timeoutMs / 1000}s`);
}

/**
 * Synchronously wait for a Dev AI Task to complete (for non-streaming calls)
 */
export async function waitForDevTask(
  taskId: string,
  timeoutMs: number = 45000
): Promise<string> {
  if (!isDevEnvironment()) {
    throw new Error("Dev Bridge wait is only available in development mode.");
  }

  const completedPath = path.join(COMPLETED_DIR, `${taskId}.json`);
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (fs.existsSync(completedPath)) {
      try {
        const completedTask: DevAiTask = JSON.parse(
          fs.readFileSync(completedPath, "utf-8")
        );
        if (completedTask.status === "FAILED") {
          throw new Error(completedTask.error || "Dev AI task execution failed.");
        }
        return completedTask.result || "";
      } catch (err: any) {
        if (err.message && err.message.includes("Dev AI task execution failed")) {
          throw err;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Dev AI Bridge timed out waiting for task ${taskId}`);
}
