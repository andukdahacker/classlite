import { AppError } from "./app-error.js";

/**
 * Maps known Prisma error codes to AppError instances.
 * Returns undefined if the error is not a recognized Prisma error.
 */
export function mapPrismaError(error: unknown): AppError | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    switch (prismaError.code) {
      case "P2025":
        return AppError.notFound("The requested record was not found");
      case "P2002":
        return AppError.conflict("A record with this value already exists");
      case "P2003":
        return AppError.badRequest(
          "Operation failed due to a foreign key constraint",
        );
    }
  }

  return undefined;
}
