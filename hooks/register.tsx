import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Usage } from '../types'

const usage = atom({ plugin: 'usage-panel', key: 'usage' } as const, null, {
  shape: 'usage-1',
})
const isHidden = atom({ plugin: 'usage-panel', key: 'isHidden' } as const, false)

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'spend',
}

// one cell per 10%, battery style
const cells = (pct: number) => Math.round(Math.min(100, Math.max(0, pct)) / 10)

const tone = (pct: number) =>
  pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'success'

const span = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  return d ? `${d}d${h}h` : h ? `${h}h${m % 60}m` : `${m}m`
}

// local time, e.g. "Thu 30 Oct 14:00"
const when = (iso: string) => {
  const t = new Date(iso)
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][t.getDay()]
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.getMonth()]
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${day} ${t.getDate()} ${mon} ${pad(t.getHours())}:${pad(t.getMinutes())}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-panel',
      description: 'Show or hide the Claude usage bars above the prompt',
    })
    const { startedAt, context, rateLimits, cost } = await $.session.usage()
    await update($, usage, () => ({ startedAt, context, rateLimits, cost }))

    return next(e)
  })

  on('command.run', { command: 'usage-panel' }, async $ => {
    const hidden = await update($, isHidden, v => !v)

    return { text: hidden ? 'Usage bars hidden.' : 'Usage bars shown.' }
  })

  // ponytail: pushed after each turn, so bars refresh per turn, not per second
  on('session.measure', async ($, e, next) => {
    await update($, usage, prev => ({
      startedAt: prev?.startedAt ?? 0,
      context: e.context,
      rateLimits: e.rateLimits,
      cost: e.cost,
    }))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const u = await read($, usage)
    if (e.props.hasSurvey || !u || (await read($, isHidden))) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const cols = e.viewport?.columns ?? 80
    const showReset = cols >= 100
    const now = await $.clock.now()
    const ctx = u.context.percent ?? 0

    const meter = (label: string, pct: number, extra?: string) => (
      <Box marginRight={3}>
        <Text dimColor>{label} </Text>
        <Text color={tone(pct)}>{'▰'.repeat(cells(pct))}</Text>
        <Text dimColor>{'▱'.repeat(10 - cells(pct))}</Text>
        <Text> {pct}%</Text>
        {extra && <Text dimColor> ↻{extra}</Text>}
      </Box>
    )

    return (
      <Box flexDirection="row" paddingX={1} marginTop={1}>
        {meter('ctx', ctx)}
        {u.rateLimits.map(r =>
          meter(
            LABELS[r.kind] ?? r.kind,
            r.percentUsed,
            showReset && r.resetsAt
              ? span(Date.parse(r.resetsAt) - now) +
                  (r.kind === 'seven_day' ? ` (${when(r.resetsAt)})` : '')
              : undefined,
          ),
        )}
        {u.cost && <Text dimColor>~${u.cost.usd.toFixed(2)} API</Text>}
      </Box>
    )
  })
}
