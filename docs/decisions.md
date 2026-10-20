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
