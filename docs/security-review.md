# Security review

| # | Finding | Fix | Test |
|---|---|---|---|
| 1 | Admin bypass: `object[token]` matched built-ins, so `Bearer constructor` passed the admin check | own-key lookups (`Object.hasOwn`) | yes |
| 2 | Finalist list and final-board tie-break revealed qualification order while standings were hidden | public board ranks by score and sudden-death marks, ties alphabetical, no "qualified #n" | [FILL] |
| 3 | Live standings visible to everyone | `standingsPublished` flag enforced in the API | [FILL] |
| 4 | New changes accepted during shutdown | 503 "restarting" on Ctrl+C | [FILL] |
| 5 | Reset during an in-flight sign-in landed in a discarded state | reset clears state in place | [FILL] |

Credit: [FILL: who found each, write only what you can back up].

## Controls in place
scrypt + salt, timing-safe compare, separate admin and team sessions, 10 failed logins per IP+team = 5 min lock, 64 KB body limit, answers never sent to browsers.

## Known gaps (verified in code)
- No registration rate limit, no team cap
- No corrupt `state.json` fallback
- Plain HTTP, shared admin password
- Sessions and logs have no expiry [VERIFY]
- Hostile-input tests cover tokens only