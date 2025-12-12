/**
 * Browser polyfill for Node.js AsyncLocalStorage
 * Used by LangGraph/DeepAgents which depend on node:async_hooks
 */

export class AsyncLocalStorage<T = unknown> {
  private currentStore: T | undefined = undefined

  getStore(): T | undefined {
    return this.currentStore
  }

  run<R>(store: T, callback: (...args: unknown[]) => R, ...args: unknown[]): R {
    const previousStore = this.currentStore
    this.currentStore = store
    try {
      return callback(...args)
    } finally {
      this.currentStore = previousStore
    }
  }

  enterWith(store: T): void {
    this.currentStore = store
  }

  disable(): void {
    this.currentStore = undefined
  }

  exit<R>(callback: (...args: unknown[]) => R, ...args: unknown[]): R {
    const previousStore = this.currentStore
    this.currentStore = undefined
    try {
      return callback(...args)
    } finally {
      this.currentStore = previousStore
    }
  }
}

export default { AsyncLocalStorage }
