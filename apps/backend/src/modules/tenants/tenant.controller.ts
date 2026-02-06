import {
  CreateTenantInput,
  TenantResponse,
  UpdateCenterInput,
} from "@workspace/types";
import { TenantService } from "./tenant.service.js";

export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  async getTenant(centerId: string): Promise<TenantResponse> {
    const result = await this.tenantService.getTenant(centerId);
    return {
      data: result,
      message: "Tenant fetched successfully",
    };
  }

  async provision(input: CreateTenantInput): Promise<TenantResponse> {
    const result = await this.tenantService.createTenant(input);
    return {
      data: result,
      message: "Tenant provisioned successfully",
    };
  }

  async update(
    centerId: string,
    input: UpdateCenterInput,
  ): Promise<TenantResponse> {
    const result = await this.tenantService.updateTenant(centerId, input);
    return {
      data: result,
      message: "Tenant updated successfully",
    };
  }
}
