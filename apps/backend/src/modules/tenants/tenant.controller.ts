import { CreateTenantInput, TenantResponse } from "@workspace/types";
import { TenantService } from "./tenant.service.js";

export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  async provision(input: CreateTenantInput): Promise<TenantResponse> {
    const result = await this.tenantService.createTenant(input);
    return {
      data: result,
      message: "Tenant provisioned successfully",
    };
  }
}
