export type RateLimit = { kind: string; percentUsed: number; resetsAt?: string }

export type Usage = {
  startedAt: number
  context: { tokens?: number; window: number; percent?: number }
  rateLimits: RateLimit[]
  cost?: { usd: number }
}

declare module 'claude-code' {
  interface PluginState {
    'usage-panel': { usage: Shaped<Usage | null>; isHidden: boolean }
  }
}
