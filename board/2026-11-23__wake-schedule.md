# Wake schedule for the go-to-market week (ask 24)

For Dinis to set up or allow himself: no agent creates, enables or changes a scheduled task. Dinis said yes to ask 24 at 22:45 UTC on 23 November 2026 (old conductor session, event 0d603924). decisions.b asked him to confirm in its session before it signs record 2026-11-23__go-to-market-wakes-amended. Schedule drafted by accountant.b (https://claude.ai/code/session_01Kw9UwEYZaKaf2XGuq7xQPF), collated by conductor.b.

## Shared rules
- Wakes 07:00 to 22:00 UTC only. A one-line skip when nothing has changed. End after the last wake on 29 November.
- cost_usd read at the start and end of each wake; the day's figures go to accountant.b at the last wake.
- Hand over at 300k context.

## The four tasks
| Agent | Session | Cron (UTC) | Notes |
|---|---|---|---|
| conductor.b | https://claude.ai/code/session_01Kw9UwFkKH5CkDmV8nhSfUD | `31 7-22 * * *` | the fresh conductor session |
| sites.b | https://claude.ai/code/session_01Kw9UwBucXVUaNYRMcWwk67 | `37 7-22 * * *` | at 274k context at 15:57: a fresh session first is better |
| hub.b | a fresh hub.b session | `43 8,10,12,14,16,18,20,22 * * *` | https://claude.ai/code/session_01Kw9UwB7XboTsnbPPWaMr2d is at 686k: hand it over first |
| design.b.rounds | https://claude.ai/code/session_01Kw9UwFCJTPWFaTq4TX5vUT | `13 7,9,11,13,15,17,19,21 * * *` | id from the conductor hand-over note |

The exact prompt for each task is in accountant.b's message to conductor.b (22:48 UTC, 23 November); conductor.b passes it on as written.

## For Dinis to decide
- The last wakes at 22:31, 22:37 and 22:43 UTC fall after the decided 22:00 end. Either keep them, or end the hourly crons at hour 21 (`7-21`) and hub.b at 20.
- The old conductor's task trig_015LDYEmyDkQNBjbiWuPnBc9 still points at https://claude.ai/code/session_01Kw9UwDCS5Px4dXRJUGP9Qu: switch it off or repoint it here.
- feedback.b's inbox round trig_01FsUjtCGwD9w9i3eBWJVoY3 has been off since 01:24 UTC on 23 November; who switched it off is not known (feedback.b and accountant.b did not). Switching it back on is Dinis's.

## Expected cost (accountant.b's estimate)
48 wakes a day, about 68 USD a day at the 1.41 USD a round measured on 21 November, about 420 USD to 29 November. A session over 600k context costs several times as much per wake.
