# Roadmap (Proposed, not built)

Nothing here is implemented. The event had 13 teams and 39 participants, so none of it was needed for that scale.
Items are ordered by cost. Each one states the problem, how I'd measure it, the cost, and what breaks first.

## 1. Buzzer fairness check
- **Problem:** Three teams won most buzzes (my recollection, not from logs). Cause unknown: poll-gated button, seat position, server ordering, or skill.
- **Measure:** Per question, buzz timestamps and the gap between 1st and 2nd. Check where the timestamp is taken (before or after an `await`).
- **Cost:** Low for the log read. A fix (a server-side `openAt` time, or push for Round 3 only) costs more.
- **Breaks first:** Gaps of hundreds of ms point to the poll lag (up to ~1.5 s), not network jitter.

## 2. Durability: fsync and corrupt-state fallback
- **Problem:** Atomic rename stops torn files, but without `fsync` a power cut can lose the latest write. A corrupt `state.json` stops startup.
- **Measure:** Kill-process and power-cut tests on a spare machine. Start with an empty and a corrupt file.
- **Cost:** One `fsync` per write adds latency to every action, because group commit waits for it.
- **Breaks first:** Reply latency. Measure before and after.

## 3. Metrics
- **Problem:** I could only guess why registration p95 rose from 1.61 s to 4.54 s.
- **Measure:** Request latency, hash queue depth, save duration, state size, event-loop lag.
- **Cost:** Low. A small `/api/admin/metrics` endpoint.
- **Breaks first:** Nothing, but it must stay admin-only.

## 4. Tests and CI
- **Problem:** Hostile-input tests cover tokens only. No automated checks on push.
- **Measure:** Coverage of game rules, auth and API errors.
- **Cost:** Low to medium. GitHub Actions running `npm test` and `npm run build`.
- **Breaks first:** Flaky timer tests. Use injected `now`, as the engine already does.
- **Note:** Don't take load numbers from shared CI runners.

## 5. Cheaper polls
- **Problem:** Each poll rebuilds standings and gzips synchronously, so cost grows with team count. Poll tests ran on a nearly empty state.
- **Measure:** Poll p95 with 13, 100 and 300 seeded teams.
- **Cost:** Cache the public state for 250-500 ms, plus async gzip or ETag/304. Stale data by up to the cache time.
- **Breaks first:** Cache invalidation. A team may not see its own answer for a moment.

## 6. Only if scale ever demands it
SSE or WebSockets, Postgres, Redis, multiple instances. They need shared state, sessions that don't live in one process, and a single owner for timers.
Out of scope for 39 devices. Kafka is not considered.

## Open experiments
- `UV_THREADPOOL_SIZE=8` with per-step timers on the registration burst
- A realistic "30 teams register once" test
- An answer-submission load test
- Bun as a controlled experiment, with before/after numbers