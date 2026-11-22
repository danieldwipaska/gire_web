import { expect, test } from "@playwright/test";

test.describe("GiRe Multi-Tenant Workspace, Notes, & Navigation E2E", () => {
  test("Super User onboarding, project/notes/task delegation, member RBAC, and tenant isolation", async ({
    page,
  }) => {
    const runId = Date.now();
    const superAEmail = `super-a-${runId}@acme.test`;
    const memberAEmail = `member-a-${runId}@acme.test`;
    const superBEmail = `super-b-${runId}@other.test`;
    const password = "Password123!";

    // 0. Verify Homepage & interactive showcase
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Your Unified Engineer Command Center/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /E2EE Notes & Storage/i }).click();
    await page.getByRole("button", { name: /Click to Unlock Demo/i }).click();
    await expect(page.getByText(/Decrypted locally in your browser/i)).toBeVisible();

    // 1. Register Super User A -> forced to /onboarding/workspace
    await page.goto("/register");
    await page.fill("#name", "Alice Super");
    await page.fill("#email", superAEmail);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/onboarding\/workspace/);

    // Attempting to bypass onboarding redirects back
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/onboarding\/workspace/);

    // Create first Workspace
    await page.fill('input[placeholder*="Acme Engineering"]', "Acme Office");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Left Sidebar shows active Workspace & Super User badge
    await expect(page.getByText("Acme Office").first()).toBeVisible();
    await expect(page.getByText("Super User").first()).toBeVisible();

    // 2. Verify Github grouped navigation routes
    await page.click('a[href="/github/activity"]');
    await expect(page).toHaveURL(/\/github\/activity/);
    await page.click('a[href="/github/issues-prs"]');
    await expect(page).toHaveURL(/\/github\/issues-prs/);
    await expect(page.getByRole("heading", { name: "GitHub Integration" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect GitHub" })).toBeVisible();
    await page.click('a[href="/github/analysis"]');
    await expect(page).toHaveURL(/\/github\/analysis/);

    // 3. Create a Project in Acme Office
    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL(/\/projects/);
    await page.getByRole("button", { name: /New Project/i }).click();
    await page.fill('input[placeholder*="Core Payment API"]', "Core Auth API");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Core Auth API")).toBeVisible();

    // 4. Create Member A in Acme Office (via /workspaces)
    await page.click('a[href="/workspaces"]');
    await expect(page).toHaveURL(/\/workspaces/);
    await page.fill('input[placeholder="e.g. Budi Santoso"]', "Budi Member");
    await page.fill('input[placeholder="budi@company.com"]', memberAEmail);
    await page.fill('input[placeholder="••••••"]', password);
    await page.getByRole("button", { name: /Create Member Account/i }).click();
    await expect(page.getByText(`Created member account for ${memberAEmail}`)).toBeVisible();

    // 5. Verify Storage Integrations menu in /notes, then create Note & Delegate Task
    await page.click('a[href="/notes"]');
    await expect(page).toHaveURL(/\/notes/);
    await page.getByRole("button", { name: /^Integrations$/i }).click();
    await expect(page.getByText(/Active: Local Server/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cloudflare R2" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Google Cloud Storage (GCP)" })).toBeVisible();
    await page.getByRole("button", { name: /^Notes \(/i }).click();

    await page.getByRole("button", { name: /New Note/i }).first().click();
    const titleInput = page.locator('input[placeholder="Note title..."]');
    await expect(titleInput).toHaveValue("Untitled Note");
    await titleInput.fill("Auth Migration Spec");
    await page.getByRole("button", { name: /^Save$/i }).click();

    await page.getByRole("button", { name: /Delegate Task/i }).first().click();
    await page.fill(
      'input[placeholder*="Implement webhook signature check"]',
      "Rotate JWT secret",
    );
    await page
      .locator("form select")
      .first()
      .selectOption({ label: `Budi Member (${memberAEmail})` });
    await page.getByRole("button", { name: /^Delegate Task$/i }).last().click();

    await expect(page.getByText("Rotate JWT secret")).toBeVisible();

    // 5b. Create an End-to-End Encrypted secret Note
    await page.getByRole("button", { name: /New Note/i }).first().click();
    await expect(titleInput).toHaveValue("Untitled Note");
    await titleInput.fill("Prod Secrets Vault");
    await page.locator(".ProseMirror").click();
    await page.keyboard.type("API_SECRET=top-secret-key-999");
    await page.getByRole("button", { name: /^Save$/i }).click();
    await expect(page.getByText("Saved")).toBeVisible();
    await page.getByRole("button", { name: /Encrypt \(E2EE\)/i }).click();
    await page.fill('input[placeholder="Enter a strong passphrase"]', "vaultPass123!");
    await page.fill('input[placeholder="Re-enter passphrase"]', "vaultPass123!");
    await page.getByRole("button", { name: /^Encrypt Note$/i }).click();
    await page.getByRole("button", { name: /^Lock$/i }).click();
    await expect(
      page.getByRole("heading", { name: "End-to-End Encrypted Note" }),
    ).toBeVisible();
    await page.fill('input[placeholder="Enter encryption passphrase..."]', "vaultPass123!");
    await page.getByRole("button", { name: /Unlock Note/i }).click();
    await expect(page.getByText("API_SECRET=top-secret-key-999")).toBeVisible();

    // 6. Sign out & log in as Member A
    await page.locator('button[title="Sign Out"]').click();
    await expect(page).toHaveURL(/\/login/);
    await page.waitForLoadState("networkidle");

    await page.fill("#email", memberAEmail);
    await page.fill("#password", password);
    await expect(page.locator("#email")).toHaveValue(memberAEmail);
    await expect(page.locator("#password")).toHaveValue(password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Member sees Acme Office & delegated task, cannot create Workspaces or delegate tasks
    await expect(page.getByText("Acme Office").first()).toBeVisible();
    await expect(page.getByText("Rotate JWT secret").first()).toBeVisible();

    // Member cannot create a Workspace via API
    const createWsStatus = await page.evaluate(async () => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Unauthorized WS" }),
      });
      return res.status;
    });
    expect(createWsStatus).toBe(403);

    // Member cannot delegate tasks via API
    const delegateTaskStatus = await page.evaluate(async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Unauthorized Task" }),
      });
      return res.status;
    });
    expect(delegateTaskStatus).toBe(403);

    // Member can view delegated task on /notes?tab=tasks, and cannot see Super User's E2EE note
    await page.goto("/notes?tab=tasks");
    await expect(page.getByText("Rotate JWT secret")).toBeVisible();
    await expect(page.getByRole("button", { name: /New Task/i })).toHaveCount(0);
    await page.getByRole("button", { name: /^Notes \(/i }).click();
    await expect(page.getByText("Prod Secrets Vault")).toHaveCount(0);

    // 7. Sign out & register Super User B -> completely isolated from Acme Office
    await page.locator('button[title="Sign Out"]').click();
    await expect(page).toHaveURL(/\/login/);
    await page.waitForLoadState("networkidle");

    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.fill("#name", "Bob Other");
    await page.fill("#email", superBEmail);
    await expect(page.locator("#email")).toHaveValue(superBEmail);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/onboarding\/workspace/);
    await page.fill('input[placeholder*="Acme Engineering"]', "Other Corp");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify isolation: Super User B cannot see Acme Office's projects, notes, or tasks
    await page.goto("/projects");
    await expect(page.getByText("Core Auth API")).toHaveCount(0);

    await page.goto("/notes");
    await expect(page.getByText("Auth Migration Spec")).toHaveCount(0);
    await expect(page.getByText("Rotate JWT secret")).toHaveCount(0);
  });
});

