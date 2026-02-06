import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTenantedClient } from "./tenanted-client";

describe("tenanted-client", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extensionDefinition: any;

  beforeEach(() => {
    // Reset the captured extension
    extensionDefinition = null;

    mockPrisma = {
      $extends: vi.fn((ext) => {
        extensionDefinition = ext;
        return mockPrisma; // Chainable
      }),
    };
  });

  it("should be defined", () => {
    expect(getTenantedClient).toBeDefined();
  });

  it("should throw if centerId is missing", () => {
    expect(() => getTenantedClient(mockPrisma, "")).toThrow();
  });

  it("should throw if prisma client is missing", () => {
    // @ts-expect-error - testing runtime check
    expect(() => getTenantedClient(null, "center-123")).toThrow();
  });

  it("should call $extends on the passed client", () => {
    getTenantedClient(mockPrisma, "center-123");
    expect(mockPrisma.$extends).toHaveBeenCalled();
  });

  it("should intercept findMany on CenterMembership and inject centerId", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { role: "STUDENT" } };

    // Execute the intercepted operation
    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "findMany",
      args,
      query: queryFn,
    });

    // Check if query was called with modified args
    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "STUDENT",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should intercept create on CenterMembership and inject centerId", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { data: { userId: "u1", role: "STUDENT" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "create",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should NOT intercept operations on User (non-tenanted model)", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { email: "test@example.com" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "User",
      operation: "findMany",
      args,
      query: queryFn,
    });

    // Should NOT have injected centerId
    expect(queryFn).toHaveBeenCalledWith({
      where: {
        email: "test@example.com",
      },
    });
  });

  it("should handle createMany with array of data", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = {
      data: [{ userId: "u1" }, { userId: "u2" }],
    };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "createMany",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({ userId: "u1", centerId: "center-123" }),
          expect.objectContaining({ userId: "u2", centerId: "center-123" }),
        ],
      }),
    );
  });

  it("should intercept create on Course and inject centerId", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { data: { name: "IELTS 101" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "Course",
      operation: "create",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "IELTS 101",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should rewrite findUnique to findFirst with centerId", async () => {
    const mockFindFirst = vi.fn();
    mockPrisma.centerMembership = { findFirst: mockFindFirst };
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { id: "mem-1" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "findUnique",
      args,
      query: queryFn,
    });

    // findUnique should NOT call the original query
    expect(queryFn).not.toHaveBeenCalled();
    // Instead it should call findFirst on the base prisma client
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "mem-1",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should rewrite findUniqueOrThrow to findFirstOrThrow with centerId", async () => {
    const mockFindFirstOrThrow = vi.fn();
    mockPrisma.centerMembership = { findFirstOrThrow: mockFindFirstOrThrow };
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { id: "mem-1" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "findUniqueOrThrow",
      args,
      query: queryFn,
    });

    expect(queryFn).not.toHaveBeenCalled();
    expect(mockFindFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "mem-1",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should inject centerId into upsert where, create, and update", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = {
      where: { id: "mem-1" },
      create: { userId: "u1", role: "STUDENT" },
      update: { role: "TEACHER" },
    };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "upsert",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "mem-1", centerId: "center-123" }),
        create: expect.objectContaining({
          userId: "u1",
          role: "STUDENT",
          centerId: "center-123",
        }),
        update: expect.objectContaining({
          role: "TEACHER",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should inject centerId into update where clause", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { id: "mem-1" }, data: { role: "ADMIN" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "update",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "mem-1", centerId: "center-123" }),
      }),
    );
  });

  it("should inject centerId into delete where clause", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { id: "mem-1" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "delete",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "mem-1", centerId: "center-123" }),
      }),
    );
  });

  it("should inject centerId into deleteMany where clause", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { role: "STUDENT" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "deleteMany",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "STUDENT",
          centerId: "center-123",
        }),
      }),
    );
  });

  it("should inject centerId into updateMany where clause", async () => {
    getTenantedClient(mockPrisma, "center-123");

    const queryFn = vi.fn();
    const args = { where: { role: "STUDENT" }, data: { role: "TEACHER" } };

    await extensionDefinition.query.$allModels.$allOperations({
      model: "CenterMembership",
      operation: "updateMany",
      args,
      query: queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "STUDENT",
          centerId: "center-123",
        }),
      }),
    );
  });
});
