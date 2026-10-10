# DTD Battleground — Decode The Data
### JNTUH Data Science Club event platform

A three-round team quiz for 20+ teams of 3, running about 2½ hours. Rounds 1 and 2 are qualifiers; the top 8 teams play a buzzer final that starts from zero.

| Stage | Format | Scoring |
|---|---|---|
| Round 1: Puzzle Sprint | 30 min, 25 questions, 60 s each | +50 per correct answer |
| Round 2: Risk Market | 4 min buying, 25 min solving | 200 coins buy Easy / Medium / Hard questions worth 30 / 70 / 110 |
| Round 3: Buzzer Final | Top 8 teams, 15 live questions | Scores reset; +50 correct, −20 wrong |

## How it works

A small Node server (`server/`, no extra dependencies) owns the timers, who can see what, answer checking and all totals. The React site only displays what the server sends, and answer keys never reach team browsers. State is saved to `server/data/state.json` after every change, so refreshing a page or restarting the server loses nothing.

| URL | Who | What |
|---|---|---|
| `/` | Teams | Register or sign in, play the current round, leaderboard, rules |
| `/#/admin` | Organisers | Phase control and timers, teams, score corrections, tie-breaks, finalists, host/judge console for the final, question review, CSV score sheet and JSON backup |
| `/#/display` | Projector | Phase, big timer, live standings; in the final, the question, buzz order and scoreboard |

## Running it

```bash
npm install
```

**During development** run the game server and the Vite dev site in two terminals, then open http://localhost:5173:

```bash
ADMIN_PASSWORD=choose-one npm run server
```

```bash
npm run dev
```

**On event day** build once, then run a single server that serves both the site and the API on http://localhost:3001 (share the machine's LAN address with teams):

```bash
npm run build
```

```bash
ADMIN_PASSWORD=choose-one npm start
```

If `ADMIN_PASSWORD` is not set, the server prints a one-time password at start-up. `PORT` and `DATA_DIR` can also be set. Restart the server after rebuilding the site (it keeps the built files in memory).

**Footprint:** the server has no runtime dependencies (Node 20+ only) and uses about 60 MB of memory. In a test with 25 teams × 3 members polling, it handled ~80 requests/s at 5 ms p95. Responses are gzipped (one state poll is about 1 KB on the wire), the 94 KB site bundle is cached by browsers, and 10 wrong passcodes from one device lock that team's sign-in on that device for 5 minutes.

## Questions

The server loads `server/questions.json` if it exists, otherwise `server/questions.sample.json` (sample questions for testing, flagged in the admin console). Copy the sample file, replace the questions, and keep the real file out of git (it is already in `.gitignore`).

- Every answer is `"type": "mcq"` (with `options` and a 0-based `answer` index) or `"type": "numeric"` (with a number `answer` and optional `tolerance`).
- `code` is shown as a code block under the prompt.
- Round 2 questions need a `level` (`easy`/`medium`/`hard`) and a `domain`; the pool needs at least 10 easy, 8 medium and 5 hard so teams can reach the caps.
- Round 3 questions marked `"reserve": true` are used after a voided question.
- `practice` (optional list) holds warm-up questions for the practice round; Round 3 questions marked `"practice": true` are for buzzer practice. Neither ever scores.

Check the file any time (the server also checks it at start-up and refuses to run if it is malformed):

```bash
npm run check-questions
```

## Rules implemented

- **Teams:** up to 3 named members sharing a passcode. Signing in with the same name on a second device signs out the first. New teams can register until Round 1 starts (organisers can allow late registration).
- **Practice:** an optional, unscored practice round before Round 1 uses the Round 1 screen and rules. Before the final, organisers can show practice questions that run the full buzzer flow without changing scores.
- **Round 1:** one open question per team at a time; the 60 s timer is set by the server when the question is opened and is not reset by refreshing; one submission per question. A malformed answer (e.g. letters in a numeric box) is rejected without using the attempt. Ties go to less total time on correct answers.
- **Round 2:** blind purchases (domain and level only) within 200 coins and the 10 / 8 / 5 caps; purchases can be returned while the market is open; solving starts automatically when buying ends. Wrong answers score 0 and are not refunded.
- **Qualification order:** total of Rounds 1 and 2, then earlier last correct Round 2 answer, then fewer coins spent, then less Round 1 time, then sudden death (recorded by organisers).
- **Final:** host shows the question, opens buzzers, names the first eligible buzzer (10 s countdown), and the judge marks correct / wrong / timeout. One rebound to a different team. Voiding a question reverses its points with logged entries. Ties: sudden death, then the higher qualifier.
- **Corrections:** every manual score change needs a reason and is kept in a visible log.

## Tests

```bash
npm test
```

Covers wrong, late and duplicate submissions, over-budget and over-cap buying, duplicate logins, tie-breaks, the buzzer flow and both practice modes.

## Event-day runbook (technical operator)

**Days before**
1. Put the reviewed questions in `server/questions.json` and run `npm run check-questions` until it says `OK` with no warnings you care about.
2. At the venue, connect a phone to the venue Wi-Fi and open `http://<laptop-ip>:3001`. College Wi-Fi often blocks phones from reaching laptops ("client isolation"); if the page does not load, bring your own router or hotspot, or host the server online behind HTTPS.
3. Rehearse with at least 10 people on their own phones, including iPhones.

**On the day**
1. Plug the laptop in and turn off sleep. Start with `npm run build`, then `ADMIN_PASSWORD=<secret> npm start`.
2. Find the laptop's address (macOS: `ipconfig getifaddr en0`; Windows: `ipconfig`) and put `http://<that-address>:3001` on the projector and on table cards.
3. Open `/#/admin` on the organiser laptop and `/#/display` on the projector.
4. During check-in, use **Start practice round** for the briefing. Then **End practice, start Round 1**. Rounds 1 and 2 close by themselves; the console has the buttons for everything else.
5. Before the final: settle any ties at the cut on the **Teams & scores** tab, lock finalists, start the final, and run one or two **practice questions** as buzzer practice.
6. Click **Backup** after every round, and keep the downloaded files on a second device. **Score sheet** gives a CSV of the standings.

**If the server or laptop dies**
- Restarting the server loses nothing: the state is in `server/data/state.json`.
- On a replacement machine: install the project, copy the latest `dtd-backup.json` to `server/data/state.json`, and start the server. Teams stay signed in if the address stays the same; otherwise they sign in again with their team passcode. Timers keep their original end times, so use **+1 min** if the outage ate into a round.
- If online buzzing misbehaves, void the question (its points are reversed in the log) and switch to physical buzzers; keep scoring in the final console with **Log correction**.

## Tech stack

React 19, Vite 8, Tailwind CSS v4, Lucide icons, canvas-confetti, and Node's built-in `http` module for the server.
