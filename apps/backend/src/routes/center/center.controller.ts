import { Auth } from "firebase-admin/auth";
import {
  GetCenterResponse,
  RegisterCenterInput,
  RegisterCenterResponse,
  SignInCenterInput,
  SignInCenterResponse,
} from "@workspace/types";
import { AppJwtPayload } from "../../middlewares/auth.middleware.js";
import JwtService from "../../services/jwt.service.js";
import CenterService from "./center.service.js";

class CenterController {
  constructor(
    private readonly centerService: CenterService,
    private readonly firebaseAuth: Auth,
    private readonly jwtService: JwtService,
  ) {}

  async getCurrentCenter(id: string): Promise<GetCenterResponse> {
    const center = await this.centerService.findCenterById(id);

    if (!center) {
      throw new Error("Cannot find center");
    }

    return {
      data: {
        center,
      },
      message: "Get current center successfully",
    };
  }

  async register(input: RegisterCenterInput): Promise<RegisterCenterResponse> {
    const { email, name } = input;

    const existedAccount = await this.centerService.findCenterByEmail(email);

    if (existedAccount) {
      throw new Error("An account has already used this email address");
    }

    const center = await this.centerService.createCenter(email, name);

    return {
      data: {
        center,
      },
      message: "Registered center successfully",
    };
  }

  async signIn(input: SignInCenterInput): Promise<SignInCenterResponse> {
    const decodedToken = await this.firebaseAuth.verifyIdToken(
      input.idToken,
      true,
    );

    const email = decodedToken.email;

    if (!email) {
      throw new Error("Invalid token");
    }

    const center = await this.centerService.findCenterByEmail(email);

    if (!center) {
      throw new Error("Cannot find center");
    }

    const token = await this.jwtService.sign<AppJwtPayload>({
      id: center.id,
      email: center.email,
      isCenter: true,
      role: "ADMIN",
      centerId: center.id,
    });

    return {
      data: {
        token: token,
        center,
      },
      message: "Sign center in successfully",
    };
  }
}

export default CenterController;
