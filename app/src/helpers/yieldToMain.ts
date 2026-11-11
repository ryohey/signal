/**
 * Yield to the main thread so pending input and rendering can run, then
 * resume. Uses `scheduler.yield()` where available so the continuation is
 * prioritized ahead of other queued tasks, and falls back to `setTimeout`.
 *
 * Unlike `requestAnimationFrame`, this keeps running while the tab is hidden.
 *
 * https://developer.chrome.com/blog/use-scheduler-yield
 */
export const yieldToMain = (): Promise<void> => {
  if ("scheduler" in globalThis && "yield" in globalThis.scheduler) {
    return globalThis.scheduler.yield()
  }
  return new Promise((resolve) => setTimeout(resolve, 0))
}
