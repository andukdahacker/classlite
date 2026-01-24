import type { AuthUser } from "@workspace/types";

export const getDashboardPath = (user: AuthUser | null) => {
  if (!user) return "/sign-in";
  if (user.centerId) return `/${user.centerId}/dashboard`;

  switch (user.role) {
    case "OWNER":
      return "/dashboard/owner";
    case "TEACHER":
      return "/dashboard/teacher";
    case "STUDENT":
      return "/dashboard/student";
    case "ADMIN":
      return "/dashboard/admin";
    default:
      return "/";
  }
};
