import {
  CreateUserInput,
  CreateUserResponse,
  DeleteUserInput,
  GetUserDetailsResponse,
  GetUserInput,
  GetUserListResponse,
  NoDataResponse,
  SignInUserInput,
  SignInUserResponse,
  UpdateUserInput,
  UpdateUserResponse,
} from "@workspace/types";
import argon2 from "argon2";
import { AppJwtPayload } from "../../middlewares/auth.middleware.js";
import EmailService from "../../services/email.service.js";
import JwtService from "../../services/jwt.service.js";
import UserService from "./user.service.js";

class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async getUserById(input: GetUserInput): Promise<GetUserDetailsResponse> {
    const user = await this.userService.findUserById(input.id);

    if (!user) {
      throw new Error("Cannot find user");
    }

    return {
      data: {
        user: user,
        classes: user.classes,
      },
      message: "Get user successfully",
    };
  }

  async deleteUser(input: DeleteUserInput): Promise<NoDataResponse> {
    await this.userService.deleteUser(input.userId);

    return {
      message: "Deleted user successfully",
    };
  }

  async updateUser(input: UpdateUserInput): Promise<UpdateUserResponse> {
    const user = await this.userService.updateUser(input);

    return {
      data: {
        user,
      },
      message: "Updated user successfully",
    };
  }

  private async getCenterId(jwtPayload: AppJwtPayload) {
    let centerId = null;

    if (jwtPayload.isCenter) {
      centerId = jwtPayload.id;
    } else {
      const user = await this.userService.findUserById(jwtPayload.id);
      if (!user) {
        throw new Error("Cannot find user");
      }

      centerId = user.centerId;
    }

    if (!centerId) {
      throw new Error("Cannot get centerId");
    }

    return centerId;
  }

  async createUser(
    input: CreateUserInput,
    jwtPayload: AppJwtPayload,
  ): Promise<CreateUserResponse> {
    const centerId = await this.getCenterId(jwtPayload);

    const existingUser = await this.userService.findUserByEmail(input.email);

    if (existingUser?.centerId == centerId) {
      throw new Error("User already existed");
    }

    const { password } = input;

    const hash = await argon2.hash(password);

    const user = await this.userService.createUser(
      { ...input, password: hash },
      centerId,
    );

    await this.emailService.send({
      to: user.email,
      subject: "Welcome to ClassLite",
      template: "invitation",
      data: {
        firstName: user.firstName,
        email: user.email,
        password: password,
      },
    });

    return {
      data: {
        user,
      },
      message: "Created user successfully",
    };
  }

  async getUserList(jwtPayload: AppJwtPayload): Promise<GetUserListResponse> {
    const centerId = await this.getCenterId(jwtPayload);

    const users = await this.userService.getUserList(centerId);

    return {
      data: users.map((e) => ({
        classes: e.classes.map((c) => c.class),
        user: e,
      })),
      message: "Get user list successfully",
    };
  }

  async signIn(input: SignInUserInput): Promise<SignInUserResponse> {
    const { email, password } = input;

    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new Error("Cannot find user");
    }

    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      throw new Error("Wrong password");
    }

    const token = await this.jwtService.sign<AppJwtPayload>({
      email: email,
      id: user.id,
      isCenter: false,
      role: user.role,
      centerId: user.centerId,
    });

    return {
      data: {
        token,
        user,
      },
      message: "Sign in user successfully",
    };
  }
}

export default UserController;
