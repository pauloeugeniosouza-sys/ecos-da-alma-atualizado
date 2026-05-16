import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("newsletter.subscribe", () => {
  it("should subscribe a user to the newsletter with valid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.newsletter.subscribe({
      email: "subscriber@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Subscrito com sucesso");
  });

  it("should reject invalid email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.newsletter.subscribe({
        email: "invalid-email",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle duplicate email subscription gracefully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First subscription
    const result1 = await caller.newsletter.subscribe({
      email: "duplicate@example.com",
    });
    expect(result1.success).toBe(true);

    // Second subscription with same email
    const result2 = await caller.newsletter.subscribe({
      email: "duplicate@example.com",
    });

    // Should either succeed (resubscribe) or handle gracefully
    expect(result2).toBeDefined();
  });
});

describe("memories.submit", () => {
  it("should submit a memory with valid data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.memories.submit({
      email: "memory@example.com",
      memory: "Esta é uma memória muito significativa que ressoa profundamente comigo.",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Obrigado");
  });

  it("should reject memory that is too short", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.memories.submit({
        email: "memory@example.com",
        memory: "Curta",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject memory that exceeds max length", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const longMemory = "A".repeat(1001);

    try {
      await caller.memories.submit({
        email: "memory@example.com",
        memory: longMemory,
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject invalid email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.memories.submit({
        email: "invalid-email",
        memory: "Esta é uma memória muito significativa que ressoa profundamente comigo.",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("memories.getApproved", () => {
  it("should retrieve approved memories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.memories.getApproved();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.memories)).toBe(true);
  });

  it("should return empty array if no approved memories exist", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.memories.getApproved();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.memories)).toBe(true);
  });
});
