# GiRe Web — User Guide

Welcome to **GiRe Web**, your unified engineering workspace for managing office and freelance software work without constantly switching between GitHub, Figma, and Notion.

---

## 1. Getting Started: Super User & First Workspace

GiRe uses an isolated **Workspace** model:

1. **Create a Super User Account:**
   - Open `/register` and sign up with your name, email, and password.
   - Public registration always creates a **Super User** account.
2. **Create Your First Workspace (Required):**
   - Immediately after registering, you will be redirected to `/onboarding/workspace`.
   - Enter a name for your first Workspace (for example, `My Engineering Hub`, `Acme Office`, or `Freelance Studio`) and click **Create Workspace & Continue**.
3. **Create Additional Workspaces (Optional, Super User only):**
   - Use the **Workspace Switcher** at the top of the left sidebar or open **Workspace** (`/workspaces`) to create and switch between multiple Workspaces (e.g., separate Workspaces for separate teams or companies).

---

## 2. Managing Workspace Members

Regular **Member** accounts cannot self-register and can only belong to **one** Workspace.

1. Go to **Workspace** (`/workspaces`) in the left sidebar.
2. Under **Create Member in \<Workspace\>**, enter the teammate's **Full Name**, **Email**, and **Initial Password** (minimum 6 characters).
3. Share those credentials with your teammate so they can sign in at `/login`.

> **Privacy Guarantee:** Every user's GitHub integrations, PRs, issues, and activity logs are strictly private to their own GiRe account. Even inside the same Workspace, teammates cannot see your GitHub data.

---

## 3. Connecting GitHub Accounts

You can connect **one or multiple GitHub accounts** (for example, one labeled `Office` and one labeled `Freelance`):

1. Open **Github → Issue and PRs** (`/github/issues-prs`).
2. In the **Integrations** panel, click **Add New**.
3. Choose an **Account Label** (`Office`, `Freelance`, or `Personal`) and paste your GitHub **Personal Access Token (PAT)** with `repo` scope. Your GitHub username is detected automatically from the token.
4. Click **Sync Now** in the top-right corner of Dashboard or any GitHub page.
   - The first sync pulls issues, pull requests, and events back to **January 1 of the current year**.
   - Subsequent syncs run incrementally and automatically refresh the page data when finished.

---

## 4. Daily Workflow Across the Sidebar

### Dashboard (`/dashboard`)
Your high-level daily command center:
- **Needs Attention:** Combined count of PRs awaiting your review and urgent/high delegated tasks.
- **Office vs. Freelance Workspace Cards:** Side-by-side summary of open PRs, reviews, issues, and tasks per context.
- **GitHub Queue & Delegated Tasks:** Act on PR reviews, assigned issues, and delegated tasks in one place.
- **Snapshots:** Quick access to Active Projects, Recent Notes, and Recent GitHub Activity.

### Github Section
- **Activity (`/github/activity`):** Chronological log of PRs you created, updated/pushed to, reviewed, commented on, merged, or closed. Switch between **Timeline** and **PRs Touched** views, or click **Copy Standup** to copy a Markdown summary for daily standups.
- **Issue and PRs (`/github/issues-prs`):** View **My Pull Requests** (`Today`, `Last Week`, `Last Month`), **Issues Assigned**, and **PRs Needing Review**—each with independent `All | Office | Freelance | Personal` filter pills.
- **Analysis (`/github/analysis`):** Inspect code churn per day, merged PR timeline, merged PRs vs. pending reviews, and repository merge rates over selectable time ranges (`This Week` through `This Year`).

### Working Directly in the Detail Drawer
Click any PR card, Issue card, or GitHub Activity item to open the **Detail Drawer**:
- **Overview & Review:** Read the full description, check CI check runs, browse the comment/review timeline, post a comment, **Approve / Request Changes**, **Merge** (`Squash`, `Merge`, or `Rebase`), or **Close / Reopen**.
- **Files Changed:** Inspect file-by-file additions, deletions, and syntax-colored diffs without leaving GiRe.

---

## 5. Projects & Figma Previews (`/projects`)

1. Open **Projects** (`/projects`) and click **New Project**.
2. Set a **Category** (`Office`, `Freelance`, or `Personal`), Client/Team name, and link your synced GitHub repositories.
3. Open a Project to access:
   - **GitHub Work:** PRs, issues, and activity filtered to that project's repos.
   - **Figma Preview:** Paste any Figma `design` or `prototype` share URL (*Anyone with the link can view*) to inspect designs and click through interactive prototypes inline. Use **Open in Figma** whenever you need to download assets or inspect typography.
   - **Notes & Tasks:** Notes and delegated tasks linked to the project.
   - **Members:** Manage project collaborators within the same Workspace.

---

## 6. Rich Notes & Task Delegation (`/notes`)

GiRe includes a built-in rich editor to replace Notion for engineering notes:

- **Formatting & Code Blocks:** Use headings (`H1`–`H3`), bold/italic/underline, bullet/numbered lists, interactive checklists, tables, links, and syntax-highlighted **Code Blocks** with language selection.
- **Saving Images:** Click the image icon in the toolbar, drag-and-drop an image file, or paste a screenshot directly (`Ctrl+V`). Images are stored on your server and embedded in the note.
- **Delegating Tasks (Super User only):**
  1. Highlight text inside a note and click **Delegate Selection as Task** (or click **Delegate Task** below the editor).
  2. Pick a **Member** in the same Workspace, set priority and due date, and submit.
  3. The assignee automatically gets read access to the source Note and sees the task under **Delegated Tasks** and on their **Dashboard**, where they can update its status (`To Do` → `In Progress` → `In Review` → `Done`).

