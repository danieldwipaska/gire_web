import { describe, expect, it } from "vitest";
import { isSuperUserRole, signToken, verifyToken } from "@/lib/auth";

describe("auth & role helpers", () => {
  it("distinguishes super_user / legacy user from regular member", () => {
    expect(isSuperUserRole("super_user")).toBe(true);
    expect(isSuperUserRole("user")).toBe(true);
    expect(isSuperUserRole("member")).toBe(false);
  });

  it("signs and verifies JWT session payloads", async () => {
    const token = await signToken({
      id: "user-123",
      email: "boss@acme.com",
      name: "Boss",
      role: "super_user",
    });

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("user-123");
    expect(verified?.email).toBe("boss@acme.com");
    expect(verified?.role).toBe("super_user");
  });

  it("rejects tampered or malformed JWT tokens", async () => {
    expect(await verifyToken("not-a-valid-token")).toBeNull();
    const token = await signToken({
      id: "user-123",
      email: "boss@acme.com",
      name: "Boss",
      role: "super_user",
    });
    expect(await verifyToken(`${token}tampered`)).toBeNull();
  });
});

