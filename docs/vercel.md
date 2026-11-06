# Front previews on Vercel

The Vercel project **chop-chop-front**, in **mahkalixs-projects**, is connected to
`Mahkalix/CHOP-CHOP` with the native Vercel GitHub integration.

- Project: https://vercel.com/mahkalixs-projects/chop-chop-front
- Production branch: `main`
- Root Directory: repository root (leave empty), **not** `front`
- Node.js: 22.x
- Framework: Vite
- Install: `corepack enable && pnpm install --frozen-lockfile`
- Build: `pnpm build:front`
- Output: `front/dist`
- Ignored Build Step: `node scripts/vercel-ignore-build.mjs`

The commands are versioned in the root `vercel.json`. Installing from the repository
root preserves the pnpm workspace dependency on `@chopchop/shared`. Corepack selects
the pnpm version declared in `package.json`. Only the static front output is served;
the API and database are not deployed by this project.

## Pull requests and bot

Enable Preview Deployments in Project Settings and leave the native GitHub PR
comments enabled in Settings → Git. The Vercel GitHub App must have access to this
repository. No GitHub Actions deploy workflow or `VERCEL_TOKEN` secret is required.
The native integration builds non-production branches, publishes the deployment
check, and posts/updates the `vercel[bot]` preview comment on the PR. Pushes to `main`
use the production environment after merging.

The ignored-build script compares the current commit against
`VERCEL_GIT_PREVIOUS_SHA` (the previous deployment commit), so it covers multiple
commits in a push. It builds for `front/`, `packages/shared/`, `scripts/`, and shared
workspace/build configuration. Backend-only and documentation-only changes are
skipped when a comparison is available. A first deployment, missing Git history,
or an unknown comparison always builds rather than risking a stale preview.
Vercel's exit codes are inverted: **0 skips, 1 builds**.

## Verification

1. Open a PR changing the front or `vercel.json` against `main`.
2. Verify a Vercel deployment check and a `vercel[bot]` comment appear.
3. Wait for Ready, then follow the preview URL and verify the rendered front.
4. Push another front commit: the preview must update to that commit.
5. For a backend-only change with previous deployment history, verify the build
   is skipped. First deployments may deliberately build.

Previews retain the project's Vercel Authentication protection; sign in to Vercel
to view them. Fork PRs may require approval by a Vercel team member. Do not disable
those protections just to make a preview check pass.

The menu/navigation feature is a separate PR (#27); until it is merged, previews
of branches based on current `main` show the existing front placeholder.
