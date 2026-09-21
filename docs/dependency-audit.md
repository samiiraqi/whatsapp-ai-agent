# Dependency audit

`npm audit` was run in `app/server` and `app/simulator` on 2026-09-21.
Both report the same 5 findings, from the same root cause.

## What was found

All 5 findings come from one chain: our `vitest` version (`^2.1.9`,
a devDependency used only to run tests) pulls in `vite`, `esbuild`,
`vite-node`, and `@vitest/mocker`, and older versions of those have
known issues.

| Package | Severity | What it is in plain English |
|---|---|---|
| `esbuild` | moderate | esbuild's own local dev server would answer requests from any website, not just from the local machine, letting a malicious page read source files it shouldn't. |
| `vite` | high | Vite's dev server has a path-traversal bug (can be tricked into serving files outside the project via source maps) and a Windows-only bug in its "open in editor" feature. |
| `vite-node` | moderate | Same underlying `vite` bug, reachable through `vite-node` (used internally by Vitest to run test files). |
| `@vitest/mocker` | moderate | A path-traversal bug in Vitest's module-mocking feature, using a similar trick to the `vite` one, that can expose file contents. |
| `vitest` | critical | If Vitest's optional UI/browser server (`vitest --ui`) is left running and reachable, a remote page can get it to read and execute arbitrary files. |

## Does it affect this project?

No. All 5 are practically unreachable here:

- They live in **devDependencies** only. They are never installed or
  run as part of `app/server` or `app/simulator` in normal operation
  — only when running tests.
- Every one of them requires a **dev/UI server to be running and
  reachable** (Vite's dev server, or `vitest --ui`). This project
  never starts either — `npm test` runs `vitest run`, which uses
  `esbuild`/`vite` internally just to transform test files and exits;
  it does not open a network-reachable server.
- Two of the `vite` issues are **Windows-only** (this project runs on
  Linux/macOS in practice).

So the risk today is effectively none, but the versions are still
worth updating when convenient, since it removes the issue entirely
rather than relying on "we don't use that feature."

## What was fixed

`npm audit fix` (without `--force`) was run in both `app/server` and
`app/simulator`. It made **no changes** — npm reports the only
available fix is upgrading `vitest` from `^2.1.9` to `4.1.11`, which
it flags as `isSemVerMajor: true` (a breaking change), so it's
outside what `npm audit fix` will do on its own.

## What was left, and the options

All 5 findings remain, tied to the single `vitest` version. Options:

1. **Leave it.** Given the findings only matter if a dev/UI server is
   exposed, and this project never runs one, the risk is minimal.
   Revisit next time `vitest` is touched for another reason.
2. **Upgrade `vitest` to `^4.1.11` now** (`npm install -D vitest@^4.1.11`
   in both `app/server` and `app/simulator`, or `npm audit fix --force`).
   This is a major-version jump (v2 → v4) and may need config or API
   changes — needs a test run afterward to confirm nothing broke
   before trusting it.
3. **Upgrade later, deliberately**, as its own small step (bump the
   version, run the full test suite, fix anything the new major
   version changed) rather than folding it into this audit.

No changes were made for this section — awaiting a decision on which
option to take.
