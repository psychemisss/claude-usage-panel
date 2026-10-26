# claude-usage-panel

A Claude Code mod that shows your usage as battery-style bars above the prompt:
context window fill, the 5-hour and 7-day rate-limit windows (with reset countdowns,
and the 7-day reset date and time), and the session's estimated API cost.

```
 ctx ▰▰▰▱▱▱▱▱▱▱ 34%   5h ▰▰▱▱▱▱▱▱▱▱ 18% ↻2h14m   7d ▰▱▱▱▱▱▱▱▱▱ 9% ↻4d3h (Thu 30 Oct 14:00)   ~$1.47 API
```

Bars turn yellow at 70% and red at 90%. They refresh after each turn. Rate limits are
account-wide, so usage from other sessions shows up after this session's next reply.
Reset times are hidden below 100 columns.

`/usage-panel` shows or hides the bars.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install usage-panel --marketplace psychemisss/claude-usage-panel
```

From a shell:

```
claude plugin install usage-panel --marketplace psychemisss/claude-usage-panel
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with
`psychemisss/claude-usage-panel`, then Add plugin.
