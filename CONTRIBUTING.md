# Development workflow

All repository content, code comments, commit messages, issues and pull requests are written in English.

## One increment at a time
1. Define the increment's outcome, exclusions and acceptance checks in an issue or PR.
2. Start a dedicated branch from the appropriate base: `feat/<scope>`, `fix/<problem>`, `docs/<topic>` or `chore/<task>`.
3. Keep commits coherent and describe the change with a concrete English message.
4. Run the checks appropriate to the change. Record manual evidence and unresolved limits.
5. Open a PR into `main`. If another unmerged increment is required, use an explicitly documented stacked PR and name its dependency.
6. Merge only after the increment's checks and review are complete. Do not include unrelated changes or claim unfinished live validation.

Do not commit implementation changes directly to `main`.

## First increment
Branch: `feat/desktop-painting`.

Scope: runnable desktop prototype, simulated painting, local export, native Presage adapter, local API-key input and a short-session usage limit. Live-camera acquisition is an explicit pending validation item, not a completed claim.

## Free-plan policy
The owner's spending limit is **USD 0**. Keep Presage on Free. Never upgrade, buy credits, enter payment details or enable a paid service without a new explicit instruction. Prefer simulation for development. Real sessions have a two-minute software limit and require manual restart. This limit conserves usage; it is not an account-level billing guarantee.

## Credentials
Never put passwords, API keys, camera recordings or physiological data into commits, issues, PRs, screenshots or test artifacts. The app's masked API-key field accepts a key for the current app launch only. It does not accept or need your account password. Test fixtures must be clearly synthetic.

## Checks
Run `npm run check` for type checks and automated tests. Run `npm run package` when desktop code, packaging, dependencies or UI behavior changes. Use the manual checklist in `docs/testing/FIRST_INCREMENT.md` for desktop behavior. No real camera or Presage key is required in CI.
