import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantController } from "./tenant.controller.js";
import { TenantService } from "./tenant.service.js";

describe("TenantController", () => {
  let tenantController: TenantController;
  let mockTenantService: any;

  beforeEach(() => {
    mockTenantService = {
      createTenant: vi.fn(),
    };
    tenantController = new TenantController(mockTenantService as TenantService);
  });

  it("provision should return data", async () => {
    const input = {
      name: "Test Center",
      slug: "test-center",
      ownerEmail: "owner@test.com",
      ownerName: "Owner",
    };
    const mockResult = {
      center: {
        id: "center-123",
        name: "Test Center",
        slug: "test-center",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      owner: {
        id: "owner-123",
        email: "owner@test.com",
        name: "Owner",
        role: "OWNER" as const,
      },
    };
    mockTenantService.createTenant.mockResolvedValue(mockResult);

    const result = await tenantController.provision(input);

    expect(mockTenantService.createTenant).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      data: mockResult,
      message: "Tenant provisioned successfully",
    });
  });
});
