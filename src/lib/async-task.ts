import { after } from "next/server";

/**
 * Executes an asynchronous task in the background safely.
 *
 * In Next.js 15 serverless runtime, this utilizes the native `after()` lifecycle hook
 * to guarantee that the serverless function environment remains alive until the task settles,
 * avoiding abrupt task terminations or dropped HTTP requests.
 *
 * If invoked outside of a Next.js request context (such as during test execution or CLI scripts),
 * it gracefully falls back to non-blocking promise execution with error capturing.
 */
export function runInBackground(task: () => Promise<void>): void {
  try {
    after(task);
  } catch {
    // Graceful fallback for non-request environments (e.g. Vitest / CLI)
    task().catch((err) => {
      console.error("[runInBackground Fallback Error]:", err);
    });
  }
}
