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
