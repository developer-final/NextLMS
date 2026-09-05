import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  isDevEnvironment,
  isDevBridgeRunning,
  enqueueDevTask,
  getDevBridgeStats,
} from "./dev-bridge";

describe("Dev AI Bridge Task Queue", () => {
  const tasksDir = path.join(process.cwd(), ".dev-ai-tasks");
  const queueDir = path.join(tasksDir, "queue");
  const heartbeatFile = path.join(tasksDir, "heartbeat.json");

  beforeEach(() => {
    // Force development environment for test
    process.env.APP_ENV = "development";
  });

  afterEach(() => {
    // Clean up test tasks created during run
    if (fs.existsSync(queueDir)) {
      const files = fs.readdirSync(queueDir);
      for (const file of files) {
        if (file.startsWith("task_")) {
          try {
            fs.unlinkSync(path.join(queueDir, file));
          } catch {
            // Ignore
          }
        }
      }
    }
    if (fs.existsSync(heartbeatFile)) {
      try {
        fs.unlinkSync(heartbeatFile);
      } catch {
        // Ignore
      }
    }
  });

  it("should correctly identify development environment", () => {
    expect(isDevEnvironment()).toBe(true);
  });

  it("should return false for isDevBridgeRunning when no heartbeat exists", () => {
    if (fs.existsSync(heartbeatFile)) {
      fs.unlinkSync(heartbeatFile);
    }
    expect(isDevBridgeRunning()).toBe(false);
  });

  it("should detect active heartbeat when written recently", () => {
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
    fs.writeFileSync(
      heartbeatFile,
      JSON.stringify({
        workerPid: 1234,
        timestamp: Date.now(),
        mode: "test",
        activeProvider: "gemini",
      }),
      "utf-8"
    );

    expect(isDevBridgeRunning()).toBe(true);

    const stats = getDevBridgeStats();
    expect(stats.running).toBe(true);
    expect(stats.heartbeat?.workerPid).toBeGreaterThan(0);
  });

  it("should enqueue a new dev task and persist to queue directory", () => {
    const taskId = enqueueDevTask("chat", {
      prompt: "Test AI bridge prompt",
      messages: [{ role: "user", content: "Hello AI" }],
    });

    expect(taskId).toBeDefined();
    expect(taskId).toContain("task_");

    const taskPath = path.join(queueDir, `${taskId}.json`);
    expect(fs.existsSync(taskPath)).toBe(true);

    const taskContent = JSON.parse(fs.readFileSync(taskPath, "utf-8"));
    expect(taskContent.id).toBe(taskId);
    expect(taskContent.type).toBe("chat");
    expect(taskContent.status).toBe("PENDING");
    expect(taskContent.prompt).toBe("Test AI bridge prompt");
  });
});
