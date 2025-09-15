import { GetMeResponse } from "@workspace/types";
import { AppJwtPayload } from "../../middlewares/auth.middleware.js";
import CenterService from "../center/center.service.js";
import UserService from "../user/user.service.js";

class MeController {
  constructor(
    private readonly centerService: CenterService,
    private readonly userService: UserService,
  ) {}

  async getMe(jwtPayload: AppJwtPayload): Promise<GetMeResponse> {
    const { id, isCenter } = jwtPayload;

    if (isCenter) {
      const center = await this.centerService.findCenterById(id);

      if (!center) {
        throw new Error("Cannot find center");
      }

      return {
        data: {
          center: center,
        },
        message: "Get me successfully",
      };
    }

    const user = await this.userService.findUserById(id);

    if (!user) {
      throw new Error("Cannot find user");
    }

    return {
      data: {
        user,
      },
      message: "Get me successfully",
    };
  }
}

export default MeController;
