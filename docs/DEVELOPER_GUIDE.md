# GiRe Web — Developer Guide

This document covers the architecture, data-isolation boundaries, local development setup, testing strategy, and VPS deployment details for contributors working on **GiRe Web**.

---

## 1. Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, Server & Client Components)
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB with Mongoose 9
- **Authentication:** Stateless HS256 JWT (`jose`) stored in `httpOnly` cookie `token`, passwords hashed with `bcrypt`
- **GitHub Integration:** `octokit` (REST + Search + User Events APIs)
- **Rich Text Editor:** Tiptap v3 (`@tiptap/react`, `StarterKit`, `CodeBlockLowlight` + `lowlight`, `TableKit`, `TaskList`, `Image`)
- **Charts & UI:** Tailwind CSS v4, `recharts`, `lucide-react`
- **Testing:** Vitest (unit/API tests) + Playwright (E2E browser tests)

---

## 2. Architecture & Data Isolation Model

GiRe enforces **two distinct isolation boundaries**:

### A. Workspace-Scoped (Multi-Tenant Isolation)
Entities scoped by `workspaceId`:
- `Workspace` (`models/Workspace.ts`) — owned by a `super_user` (`ownerId`)
- `Project` (`models/Project.ts`)
- `Note` (`models/Note.ts`)
- `Task` (`models/Task.ts`)

Rules enforced in `lib/workspace.ts` and API routes:
- `super_user` (and legacy `user`) accounts can own and switch between multiple `Workspace`s via `gire_workspace` cookie and `User.activeWorkspaceId`.
- `member` accounts are created exclusively by a `super_user` via `POST /api/workspaces/members` and are permanently bound to a single `User.workspaceId`.
- All queries and mutations on Projects, Notes, Tasks, and Member search (`/api/users/search`) verify `workspaceId === activeWorkspace._id`.
- Only `super_user` accounts can create Workspaces, create/delete Members, or create/delegate/delete Tasks (`POST /api/tasks`, `DELETE /api/tasks/[id]`).

### B. User-Oriented (GitHub, Storage, & E2EE Notes Isolation)
Entities scoped strictly by `userId` (never shared across Workspace members):
- `Integration` (`models/Integration.ts`) — compound unique index `{ userId, provider, githubUsername }` (`accessToken` encrypted at rest with AES-256-GCM)
- `StorageIntegration` (`models/StorageIntegration.ts`) — per-user Cloudflare R2 (`cloudflare_r2`) & GCP Cloud Storage (`gcp_gcs`) configs (secrets encrypted at rest)
- `PullRequest` (`models/PullRequest.ts`) — compound unique index `{ userId, githubId }`
- `Issue` (`models/Issue.ts`) — compound unique index `{ userId, githubId }`
- `ActivityEvent` (`models/ActivityEvent.ts`) — compound unique index `{ userId, githubEventId }`
- **E2EE Notes (`isEncrypted: true`):** Encrypted client-side via `lib/security/e2ee.ts` (`PBKDF2` + `AES-256-GCM`) and enforced as strictly owner-only on all server queries and `PATCH /api/notes/[id]`.

`lib/github/client.ts` (`runWithRepoOctokit`) resolves the matching connected GitHub integration token for a repository (with fallback across the user's connected GitHub accounts for private repos).

---

## 3. Directory Structure

```text
app/
  (auth)/login, register          # Login & Super User registration
  onboarding/workspace            # Mandatory first Workspace setup
  dashboard/                      # Holistic engineering command center
  github/
    activity/                     # GitHub Events timeline & standup export
    issues-prs/                   # My PRs, Issues Assigned, Reviews, Integrations
    analysis/                     # Code churn, merged PR velocity, repo stats
  projects/                       # Project list & [id] detail (GitHub, Figma, Notes, Members)
  notes/                          # Tiptap rich notes & task delegation workspace
  workspaces/                     # Workspace switcher & Super User member management
  api/
    auth/                         # login, logout, register, me
    github/                       # detail (GET PR/Issue live), action (POST comment/review/merge/close)
    integrations/, sync/github/   # GitHub PAT management & NDJSON streaming sync
    storage-integrations/         # Cloudflare R2 & GCP Cloud Storage config API
    projects/, notes/, tasks/     # Workspace-isolated CRUD + task delegation
    uploads/                      # Image upload (R2 / GCP / local fallback) & serving
    workspaces/                   # Workspace CRUD, switch, members management
lib/
  auth.ts                         # Edge-safe JWT sign/verify, role helpers, cookie constants
  auth-server.ts                  # DB-backed session & tokenVersion verification
  workspace.ts                    # getWorkspaceContext, requirePageWorkspaceContext, membership checks
  dashboard-service.ts            # Dashboard metrics & 7-day chart aggregation
  dates.ts                        # Local date keys & analytics range boundaries
  project-filter.ts               # ContextFilterDropdown repo resolution
  utils.ts                        # Case-insensitive user matching, Figma embed, category filters
  security/
    crypto.ts                     # AES-256-GCM encryption at rest for PAT & cloud keys
    e2ee.ts                       # Browser Web Crypto PBKDF2 + AES-GCM E2EE note helper
    network.ts                    # SSRF URL/IP/DNS validation for R2 endpoints
    rate-limit.ts                 # Bounded sliding-window rate limiter
    sanitize.ts                   # Allowlist HTML sanitizer for Note content
    upload-validation.ts          # Binary magic-byte image signature verification
  storage/
    providers.ts                  # Cloudflare R2 (SigV4) & GCP Storage (RS256 OAuth2) clients
    upload.ts                     # Active cloud storage router with local disk fallback
  github/
    client.ts                     # Multi-account Octokit candidate resolver
    sync.ts                       # Issues, PRs (from Jan 1), reviews, and Events sync
models/                           # Mongoose schemas & compound indexes
tests/
  unit/                           # Vitest unit & mocked API RBAC/isolation tests
  e2e/                            # Playwright end-to-end browser tests
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js 18+ (20+ recommended)
- MongoDB running locally or remotely

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the repository root:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/gireWeb
   JWT_SECRET=your_super_secret_jwt_key
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. If you switch branches or run `next build` between `next dev` sessions and encounter stale Turbopack route manifests, clear `.next`:
   ```bash
   rm -rf .next && npm run dev
   ```

---

## 5. Testing & Quality Checks

### Typecheck & Lint
```bash
npx tsc --noEmit
npm run lint
```

### Unit Tests (Vitest)
Unit tests cover date boundary calculations, username/review/category helpers, JWT & role logic, and mocked API isolation/RBAC enforcement:
```bash
npm run test:unit
```

### End-to-End Tests (Playwright)
E2E tests exercise real browser flows against Next.js + MongoDB (Super User registration, mandatory Workspace onboarding, navigation, Project creation, Member creation, Note creation, Task delegation, Member RBAC, and cross-tenant isolation):

1. Ensure MongoDB is running and `.env.local` has a valid `MONGODB_URI` (use a dedicated test DB if you do not want test records in your primary DB).
2. Install Playwright browsers if not already cached:
   ```bash
   npx playwright install chromium
   ```
3. Run E2E tests:
   ```bash
   npm run test:e2e
   ```
   You can also point Playwright to an already-running server:
   ```bash
   E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
   ```

### Continuous Integration (GitHub Actions)
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs automatically on every branch push and pull request:
1. **`quality-and-unit`:** Runs `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`, and `npm run build`.
2. **`e2e`:** Spins up a `mongo:7` service container, installs Playwright Chromium, and executes `npm run test:e2e`, uploading `test-results/` and `playwright-report/` artifacts on failure.

---

## 6. VPS Deployment Notes

- **Build & Run:**
  ```bash
  npm ci
  npm run build
  npm run start
  ```
- **Persistent Image Uploads:** By default (when neither Cloudflare R2 nor GCP Cloud Storage is active in `/notes` → **Integrations**), uploaded Note images are written to `<app_root>/uploads/` and served through `GET /api/uploads/[filename]` (authenticated). When using systemd on a VPS with local fallback enabled, ensure `<app_root>/uploads/` persists across releases. Private Cloudflare R2 and GCP uploads are proxied via `GET /api/uploads/cloud/[integrationId]/[...key]` with Workspace membership verification unless a custom `publicUrl` is set.
- **Environment Variables:** Set `NODE_ENV=production`, a strong `JWT_SECRET`, and `MONGODB_URI`. Note that `token` cookies use `secure: true` in production, so serve GiRe behind HTTPS (e.g., Nginx/Caddy reverse proxy).
- **Mongoose Indexes:** `syncGitHubData` runs `syncIndexes()` automatically, ensuring compound unique indexes remain aligned after upgrades.

