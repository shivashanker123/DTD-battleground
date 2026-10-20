# Decisions log

Each entry records the problem, the choice made and the trade-off accepted.

## Reply only after the change is saved (group commit)

**Problem.** Saves were batched (250 ms) and written in the background, but requests were answered
immediately. A hard crash, laptop failure or power cut inside that window lost changes that teams
had already been told succeeded ("Bought", "Correct").

**Choice.** Keep the single, in-order batched writer, but make every successful POST wait for the
write that contains its change before replying. The batching window drops to 50 ms, so a burst of
requests still becomes one disk write while replies stay fast. Polls (GET) never write.

**Trade-off.** Each action takes up to about 50 ms plus one write longer to answer. If the disk is
failing, requests are answered from memory rather than waiting for retries; the organiser console
already shows the "not saving" warning in that state. A graceful stop (Ctrl+C) still flushes first.

## Sign-in queue sized for a whole room

**Problem.** Password hashing runs 4 at a time with a waiting room of 32. When 75 phones signed in
at the same moment, 39 were told "busy, try again".

**Choice.** Raise the default waiting room to 256 (still configurable with `HASH_QUEUE_LIMIT`).
The message now says "Sign-in is busy" because it also applies to joining an existing team.

**Trade-off.** In a large burst the last sign-ins wait one to two seconds instead of failing. The
queue stays bounded, and each waiting entry costs only a few hundred bytes.

## Connection-status warning

**Problem.** Requests had no deadline, so on a flaky Wi-Fi a status poll could hang for a minute or
more and the screen froze silently. Meanwhile, a single failed poll flashed an error, which was noisy.
The projector showed nothing once it had loaded.

**Choice.** Every request now has a deadline: 5 s for status polls, 10 s for actions (which wait for
the save). `src/connection.js` holds the rules, unit-tested without a browser: show
"Connection lost - reconnecting..." after two failed polls in a row, or when a poll fails more than
5 s after the last success. Network errors, timeouts and 5xx (including busy 503) count; 401 (signed
out) and other 4xx do not. While failing, polling backs off gently (doubling, capped at 5 s). The
banner sits inside the sticky header on the team app and organiser console, and full-width on the
projector, so the last known state and timers stay visible underneath. A tab or phone coming back
to the front starts a fresh window, so waking a phone does not flash the warning. A Wi-Fi login page
answering instead of the server is also treated as "connection lost". If an answer fails to send,
the typed answer stays in the box with a message to tap Submit again.

**Trade-off.** A genuinely slow server (over 5 s per poll) now shows as "connection lost". The
stress tests put normal replies at a few milliseconds, so that only happens when something is wrong.
An action that timed out on the phone may still have been applied on the server; retrying then gets
a clear server answer such as "already answered" or "already owns this question".

## Leaderboard release control

**Problem.** Every phone could see the live Round 1, Round 2 and qualification standings at all
times, and the locked finalist list (stored in qualifying order) was public before the final began.

**Choice.** A `standingsPublished` flag, off by default and kept through the normal save. Save files
from before this change load as hidden. The server enforces it: while hidden, `GET /api/state` sends
no Round 1, Round 2 or qualification standings to visitors, teams or the projector. Each signed-in
team gets a separate `myScores` with its own points and no ranks, so its own score displays keep
working. The organiser console (`GET /api/admin/state`) always has everything, and
`POST /api/admin/standings-visibility` with `{"published": true|false}` (admin only) switches it,
from a Publish/Hide control on the "Teams & scores" tab. The leaderboard and projector say
"Scores will be revealed soon" while hidden. The CSV export was already admin-only.

Starting Round 3 makes the finalist list and live final scores public even while standings are
hidden. In that case the public final board ranks by final score only, lists tied finalists
alphabetically and leaves out the "qualified #n" labels. Otherwise, with everyone on 0 at the start,
the board order (whose tie-break is the qualifier rank) would reveal the qualification ranking.

**Trade-off.** The live leaderboard is no longer on by default; organisers must remember to publish
it, for example at the score check before the final. While hidden, tied finalists can't see from
the board who would win the "higher qualifier" tie-break. The organiser console always shows it.

## Review fixes

**Admin token bypass (also present on main).** Session lookups used `object[token]`, so a request
with `Authorization: Bearer constructor` (or `toString`, `__proto__`) matched a built-in property and
passed the admin check, exposing hidden standings, backups and the publish switch. Lookups now use
own keys only (`Object.hasOwn`) for admin sessions, team sessions and routes. A test covers it.

**Sudden death on the hidden final board.** While standings are hidden, the public final board
ranks by final score only; it now also applies the organisers' final sudden-death marks (those are
public final results), then alphabetical order.

**Graceful stop.** On Ctrl+C the server stops accepting connections and answers any new change with
503 "restarting", instead of answering "OK" for something it would not save.

**Reset during a sign-in.** "Reset event" now clears the state in place, so a sign-in that was
still hashing lands in the new (empty) event instead of a discarded copy.

**Smaller UI fixes.** Signing out on purpose no longer shows the "signed in on another device"
notice. Waking a phone no longer hides a connection warning before a poll actually succeeds.

**Not changed.** Round 1 answer times now include the short save wait (about 50 ms) before the
question appears. It applies equally to every team, so rankings are unaffected.
