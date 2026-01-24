import { AuthService } from "./auth.service.js";
import {
  AuthResponse,
  AuthUser,
  CenterSignupRequest,
  CenterSignupWithGoogleRequest,
} from "@workspace/types";

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  async centerSignup(input: CenterSignupRequest): Promise<AuthResponse> {
    const result = await this.authService.centerSignup(input);
    return {
      data: result,
      message: "Center registered successfully",
    };
  }

  async centerSignupWithGoogle(
    input: CenterSignupWithGoogleRequest,
  ): Promise<AuthResponse> {
    const result = await this.authService.centerSignupWithGoogle(input);
    return {
      data: result,
      message: "Center registered successfully with Google",
    };
  }

  async login(idToken: string): Promise<AuthResponse> {
    const result = await this.authService.login(idToken);
    return {
      data: result,
      message: "Login successful",
    };
  }

  async getCurrentUser(
    uid: string,
    centerId: string,
  ): Promise<AuthUser> {
    const result = await this.authService.getUserMembership(uid, centerId);
    if (!result) {
      throw new Error("NOT_FOUND: User not found in this center");
    }
    return {
      id: result.user.id,
      email: result.user.email || "",
      name: result.user.name || null,
      role: result.role,
      centerId: result.centerId,
    };
  }
}
