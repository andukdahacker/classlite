import {
  AssignmentSchema,
  BaseResponseErrorSchema,
  CreateAssignmentsInput,
  CreateAssignmentsInputSchema,
  CreateAssignmentsResponseSchema,
  DeleteAssignmentsInput,
  DeleteAssignmentsInputSchema,
  GetAssignmentInput,
  GetAssignmentInputSchema,
  GetAssignmentResponseSchema,
  GetAssignmentsByExerciseInput,
  GetAssignmentsByExerciseInputSchema,
  GetAssignmentsByExerciseResponseSchema,
  GetAssignmentsByUserInput,
  GetAssignmentsByUserInputSchema,
  GetAssignmentsByUserResponseSchema,
  NoDataResponseSchema,
  UpdateAssignmentInput,
  UpdateAssignmentInputSchema,
  UpdateAssignmentsResponseSchema,
} from "@workspace/types";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import AssignmentController from "./assignment.controller.js";
import AssignmentService from "./assignment.service.js";

function assignmentRoutes(fastify: FastifyInstance, opts: any) {
  fastify.addSchema(AssignmentSchema);
  fastify.addSchema(CreateAssignmentsInputSchema);
  fastify.addSchema(CreateAssignmentsResponseSchema);
  fastify.addSchema(GetAssignmentsByExerciseResponseSchema);
  fastify.addSchema(GetAssignmentsByUserInputSchema);

  const assignmentService = new AssignmentService(fastify.db);
  const assignmentController = new AssignmentController(assignmentService);

  fastify.post("/", {
    schema: {
      description: "Create assigments",
      tags: ["assignment"],
      body: CreateAssignmentsInputSchema,
      response: {
        200: CreateAssignmentsResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateAssignmentsInput }>,
      _reply,
    ) => await assignmentController.createAssignments(request.body),
  });

  fastify.put("/", {
    schema: {
      description: "Update assignments",
      tags: ["assignments"],
      body: UpdateAssignmentInputSchema,
      response: {
        200: UpdateAssignmentsResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: UpdateAssignmentInput }>,
      _reply: FastifyReply,
    ) => await assignmentController.updateAssignment(request.body),
  });

  fastify.get("/exercise", {
    schema: {
      description: "Get assignments by exercise",
      tags: ["assignment"],
      querystring: GetAssignmentsByExerciseInputSchema,
      response: {
        200: GetAssignmentsByExerciseResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Querystring: GetAssignmentsByExerciseInput }>,
      _reply: FastifyReply,
    ) => await assignmentController.getAssignmentsByExercise(request.query),
  });

  fastify.get("/student", {
    schema: {
      description: "Get student's assignments",
      tags: ["assignment"],
      querystring: GetAssignmentsByUserInputSchema,
      response: {
        200: GetAssignmentsByUserResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["STUDENT"])],
    handler: async (
      request: FastifyRequest<{ Querystring: GetAssignmentsByUserInput }>,
      _reply: FastifyReply,
    ) => assignmentController.getAssigmentsByUser(request.query),
  });

  fastify.get("/:id", {
    schema: {
      description: "Get assignment",
      tags: ["assignment"],
      params: GetAssignmentInputSchema,
      response: {
        200: GetAssignmentResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware],
    handler: async (
      request: FastifyRequest<{ Params: GetAssignmentInput }>,
      _reply: FastifyReply,
    ) => assignmentController.getAssignment(request.params),
  });

  fastify.delete("/", {
    schema: {
      description: "Delete assignment",
      tags: ["assignment"],
      body: DeleteAssignmentsInputSchema,
      response: {
        200: NoDataResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: DeleteAssignmentsInput }>,
      _reply: FastifyReply,
    ) => assignmentController.deleteAssignment(request.body),
  });
}

export default assignmentRoutes;
