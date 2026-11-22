# GiRe Web — Engineer Command Center

**GiRe Web** is a unified engineering workspace built with Next.js, MongoDB, and the GitHub API. It brings together **GitHub monitoring & actions** (Issues, Pull Requests, Review Requests, Activity Timeline, Code Analytics), **Office & Freelance Project Management** (with interactive Figma design/prototype embeds), and a **Notion-style Notes & Task Delegation** system inside isolated multi-tenant **Workspaces**.

---

## Key Features

- **Multi-Tenant Workspaces & RBAC:**
  - Public registration creates a **Super User** account who sets up one or more isolated **Workspaces** (e.g., *Office*, *Freelance*, *Client X*).
  - Super Users create and manage **Member** accounts inside their own Workspaces; Members are bound to a single Workspace and cannot self-register or create Workspaces.
  - Projects, Notes, and Delegated Tasks are strictly isolated per Workspace.
- **User-Oriented GitHub Workspace (Private Per User):**
  - Connect **multiple GitHub accounts** (e.g., Office + Freelance) via the inline **GitHub Integration** panel; tokens are encrypted at rest (**AES-256-GCM**) and GitHub data (`Integration`, `PullRequest`, `Issue`, `ActivityEvent`) is always private to the individual user—even inside the same Workspace.
  - **Dashboard:** Holistic daily command center combining Needs Attention (PR reviews + urgent tasks), Active Tasks, Active Projects, Office vs. Freelance split, GitHub Queue, Recent Notes, and Recent Activity.
  - **GitHub -> Activity:** Full timeline of PRs you created, updated, pushed to, reviewed, commented on, merged, or closed, with one-click **Copy Standup** Markdown export.
  - **GitHub -> Issue and PRs:** Active PRs (`Today`, `Last Week`, `Last Month`), Issues Assigned, and PRs Needing Review with independent `All | Office | Freelance | Personal` filters, plus the compact non-list **GitHub Integration** card.
  - **GitHub -> Analysis:** Code churn per day, merged PR velocity, review vs. merged ratio, and per-repository activity.
  - **PR & Issue Detail Drawer:** Inspect PR diffs, CI check runs, descriptions, and comment threads—and **post comments, approve/request changes, merge, or close/reopen** directly inside GiRe.
- **Projects & Figma Embeds:**
  - Group repositories under `Office`, `Freelance`, or `Personal` projects, track live open PRs/issues, and preview **Figma designs & interactive prototypes** inline.
- **Rich Notes, Cloud Storage, E2EE Vault & Task Delegation:**
  - WYSIWYG block editor powered by Tiptap + Lowlight: headings, checklists, tables, syntax-highlighted code blocks, and screenshot paste (`Ctrl+V`).
  - **Flexible Image Storage (`/notes` → Integrations):** Connect **Cloudflare R2** or **Google Cloud Storage (GCP)** (including private-bucket authenticated proxying), or fall back automatically to **Local Server (`uploads/`)** when neither is active.
  - **End-to-End Encrypted (E2EE) Secret Notes:** Optional client-side Web Crypto (**PBKDF2 + AES-256-GCM**) vault per Note for passwords and confidential secrets—zero-knowledge to the server and strictly owner-only.
  - **Super Users** can highlight text in unencrypted Notes and delegate it as a tracked Task (`todo`, `in_progress`, `in_review`, `done`) to any user in the same Workspace.
- **Hardened Application Security:**
  - Enforced `JWT_SECRET` + `tokenVersion` revocation on logout/removal, AES-256-GCM secret encryption at rest, SSRF protections for custom R2 endpoints, server-side HTML sanitization against stored XSS, image magic-byte validation, rate limiting, and strict HTTP security headers.

---

## Documentation

- **New Users:** See the [User Guide](docs/USER_GUIDE.md) for onboarding, Workspace setup, connecting GitHub accounts, reviewing PRs, embedding Figma previews, and delegating tasks.
- **Developers & Contributors:** See the [Developer Guide](docs/DEVELOPER_GUIDE.md) for architecture, data isolation rules, local setup, testing (Vitest & Playwright), and VPS deployment.

---

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure `.env.local`:**
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/gireWeb
   JWT_SECRET=replace_with_a_strong_random_secret
   ```
3. **Run development server:**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and register a **Super User** account.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint across the codebase |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
