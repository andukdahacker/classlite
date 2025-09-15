import {
  BaseResponseErrorSchema,
  CreateSubmissionInput,
  CreateSubmissionInputSchema,
  CreateSubmissionResponseSchema,
  GetSubmissionInput,
  GetSubmissionInputSchema,
  GetSubmissionListInput,
  GetSubmissionListInputSchema,
  GetSubmissionListResponseSchema,
  GetSubmissionResponseSchema,
  SubmissionContentSchema,
  SubmissionFeedbackSchema,
  SubmissionGradeSchema,
  SubmissionSchema,
  UpdateSubmissionInput,
  UpdateSubmissionInputSchema,
  UpdateSubmissionResponseSchema,
} from "@workspace/types";
import { FastifyInstance } from "fastify";
import { FastifyReply } from "fastify/types/reply.js";
import { FastifyRequest } from "fastify/types/request.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import AssignmentService from "../assignment/assignment.service.js";
import ClassService from "../class/class.service.js";
import SubmissionController from "./submission.controller.js";
import SubmissionService from "./submission.service.js";

function submissionRoutes(fastify: FastifyInstance, opts: any) {
  fastify.addSchema(SubmissionSchema);
  fastify.addSchema(CreateSubmissionInputSchema);
  fastify.addSchema(SubmissionContentSchema);
  fastify.addSchema(SubmissionGradeSchema);
  fastify.addSchema(SubmissionFeedbackSchema);
  fastify.addSchema(UpdateSubmissionInputSchema);

  const submissionService = new SubmissionService(fastify.db);
  const assignmentService = new AssignmentService(fastify.db);
  const classMemberService = new ClassService(fastify.db);
  const submissionController = new SubmissionController(
    submissionService,
    assignmentService,
    classMemberService,
  );

  fastify.post("/", {
    schema: {
      description: "Create submission",
      tags: ["submission"],
      body: CreateSubmissionInputSchema,
      response: {
        200: CreateSubmissionResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["STUDENT"])],
    handler: async (
      request: FastifyRequest<{ Body: CreateSubmissionInput }>,
      _reply: FastifyReply,
    ) => await submissionController.createSubmission(request.body),
  });

  fastify.get("/list", {
    schema: {
      description: "Get list of submissions",
      tags: ["submission"],
      querystring: GetSubmissionListInputSchema,
      response: {
        200: GetSubmissionListResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Querystring: GetSubmissionListInput }>,
      _reply: FastifyReply,
    ) =>
      await submissionController.getSubmissions(
        request.query,
        request.jwtPayload.id,
      ),
  });

  fastify.get("/:id", {
    schema: {
      description: "Get submission",
      tags: ["submission"],
      params: GetSubmissionInputSchema,
      response: {
        200: GetSubmissionResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware],
    handler: async (
      request: FastifyRequest<{ Params: GetSubmissionInput }>,
      _reply: FastifyReply,
    ) => await submissionController.getSubmission(request.params),
  });

  fastify.put("/", {
    schema: {
      description: "Update submission",
      tags: ["submisison"],
      body: UpdateSubmissionInputSchema,
      response: {
        200: UpdateSubmissionResponseSchema,
        500: BaseResponseErrorSchema,
      },
    },
    preHandler: [authMiddleware, roleMiddleware(["ADMIN", "TEACHER"])],
    handler: async (
      request: FastifyRequest<{ Body: UpdateSubmissionInput }>,
      _reply: FastifyReply,
    ) => await submissionController.updateSubmission(request.body),
  });
}

export default submissionRoutes;
