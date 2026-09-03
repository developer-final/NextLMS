import { describe, it, expect, vi } from "vitest";
import { runInBackground } from "./async-task";

describe("runInBackground Helper", () => {
  it("should execute task asynchronously without throwing", async () => {
    let executed = false;
    runInBackground(async () => {
      executed = true;
    });

    // Wait a tick for promise resolution
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(executed).toBe(true);
  });

  it("should catch errors in async task gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    runInBackground(async () => {
      throw new Error("Background failure simulation");
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
