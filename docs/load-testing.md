# Load testing

**Setup:** k6 and server on one laptop over localhost, conditions not tightly controlled.
Numbers show direction for the server code. They say nothing about router or Wi-Fi limits.

| Test | Result | Evidence |
|---|---|---|
| Poll-only, up to 1000 VUs | 23,887 polls, 0% errors, p95 1.92 ms, p99 2.5 ms | screenshot |
| Registration burst, 150 VUs, run 1 (sync hashing, full-file writes) | register p95 11.8 s, 17.8% failed, poll p95 12.6 s | notes only |
| Same, run 2 | register p95 4.4 s, 0% failed, poll p95 4.2 s | notes only |
| After async hashing + batched saves | register p95 1.61 s, poll p95 786 ms, 1639 registrations, 0% failed | notes only |
| After group commit | register p95 4.54 s, poll p95 97.6 ms, 789 registrations, 0% failed; register threshold (p95<1 s) failed | screenshot |

## What I conclude
- Polls cost about 1-3 ms alone but seconds during registrations. This is consistent with a blocked event loop (hypothesis, not profiled).
- The burst test is much harsher than the event: a closed loop of new registrations, versus 13 teams registering once.

## Open questions
- Why register p95 rose from 1.61 s to 4.54 s after group commit. Candidates: shared thread pool, `JSON.stringify` of a growing state, machine variance, closed-loop effects. `UV_THREADPOOL_SIZE` experiment: [FILL: not done].
- Poll cost with many teams (standings rebuilt and gzipped per poll). Poll tests ran on a nearly empty state.

## Not tested
Answer submission, mixed load, soak runs, two-machine setups, a realistic "30 teams register once" run, real router behaviour.