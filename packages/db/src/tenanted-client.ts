import { PrismaClient } from "./generated/client";

/**
 * Models that MUST be isolated by centerId.
 * Improved to be more robust, but ideally verify against Prisma.dmmf at build time.
 * For runtime, we can check if the model has a 'centerId' field in the schema,
 * but the extension API gives us the model name.
 */
const TENANTED_MODELS = [
  "CenterMembership",
  "Course",
  "Class",
  "ClassStudent",
  // TODO: Add automatic detection or enforce via linting
];

/**
 * Returns a Prisma Client extended with multi-tenant isolation logic.
 *
 * @param prisma - The base Prisma Client instance (from backend plugin/context)
 * @param centerId - The ID of the center to isolate data for
 */
export const getTenantedClient = (prisma: PrismaClient, centerId: string) => {
  if (!prisma) {
    throw new Error("getTenantedClient requires a prisma client instance");
  }
  if (!centerId) {
    throw new Error("getTenantedClient requires a centerId");
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Robust check: Only apply if the model is explicitly marked as tenanted
          if (TENANTED_MODELS.includes(model as string)) {
            // Force type assertion to allow dynamic property access
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const queryArgs = (args || {}) as any;

            // READ operations
            if (
              [
                "findMany",
                "findFirst",
                "count",
                "aggregate",
                "groupBy",
              ].includes(operation)
            ) {
              queryArgs.where = { ...queryArgs.where, centerId };
            }

            // findUnique -> findFirst to allow non-unique field injection
            if (
              operation === "findUnique" ||
              operation === "findUniqueOrThrow"
            ) {
              const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
              if (operation === "findUnique") {
                return (prisma as any)[modelKey].findFirst({
                  ...queryArgs,
                  where: { ...queryArgs.where, centerId },
                });
              } else {
                return (prisma as any)[modelKey].findFirstOrThrow({
                  ...queryArgs,
                  where: { ...queryArgs.where, centerId },
                });
              }
            }

            // WRITE operations - Insert
            if (["create", "createMany", "upsert"].includes(operation)) {
              if (operation === "create") {
                queryArgs.data = { ...queryArgs.data, centerId };
              }
              if (operation === "createMany") {
                if (Array.isArray(queryArgs.data)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  queryArgs.data = queryArgs.data.map((d: any) => ({
                    ...d,
                    centerId,
                  }));
                } else {
                  queryArgs.data = { ...queryArgs.data, centerId };
                }
              }
              if (operation === "upsert") {
                queryArgs.create = { ...queryArgs.create, centerId };
              }
            }

            // WRITE operations - Update/Delete
            if (
              ["update", "updateMany", "delete", "deleteMany"].includes(
                operation,
              )
            ) {
              queryArgs.where = { ...queryArgs.where, centerId };
            }
          }

          return query(args);
        },
      },
    },
  });
};
