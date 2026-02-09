import { Prisma, PrismaClient, getTenantedClient } from "@workspace/db";
import type {
  CreateExerciseInput,
  UpdateExerciseInput,
  AutosaveExerciseInput,
  Exercise,
} from "@workspace/types";
import type { Storage } from "firebase-admin/storage";
import { AppError } from "../../errors/app-error.js";

const EXERCISE_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
  sections: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      questions: { orderBy: { orderIndex: "asc" as const } },
    },
  },
  tagAssignments: {
    select: { tag: { select: { id: true, name: true } } },
  },
};

export class ExercisesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly firebaseStorage?: Storage,
    private readonly bucketName?: string,
  ) {}

  private async verifyDraftExercise(
    db: ReturnType<typeof getTenantedClient>,
    id: string,
    errorMessage: string,
  ) {
    const exercise = await db.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status !== "DRAFT") {
      throw AppError.badRequest(errorMessage);
    }
    return exercise;
  }

  async listExercises(
    centerId: string,
    filters?: {
      skill?: string;
      status?: string;
      bandLevel?: string;
      tagIds?: string[];
    },
  ): Promise<Exercise[]> {
    const db = getTenantedClient(this.prisma, centerId);

    const where: Record<string, unknown> = {};
    if (filters?.skill) where.skill = filters.skill;
    if (filters?.status) where.status = filters.status;
    if (filters?.bandLevel) where.bandLevel = filters.bandLevel;
    if (filters?.tagIds?.length) {
      where.tagAssignments = { some: { tagId: { in: filters.tagIds } } };
    }

    return await db.exercise.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            _count: { select: { questions: true } },
          },
        },
        tagAssignments: {
          select: { tag: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getExercise(centerId: string, id: string): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({
      where: { id },
      include: EXERCISE_INCLUDE,
    });

    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }

    return exercise;
  }

  async createExercise(
    centerId: string,
    input: CreateExerciseInput,
    firebaseUid: string,
  ): Promise<Exercise> {
    // Resolve Firebase UID to Prisma User ID via AuthAccount
    const authAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "FIREBASE",
          providerUserId: firebaseUid,
        },
      },
    });
    if (!authAccount) {
      throw AppError.notFound("User account not found");
    }

    const db = getTenantedClient(this.prisma, centerId);

    return await db.exercise.create({
      data: {
        centerId,
        title: input.title,
        instructions: input.instructions ?? null,
        skill: input.skill,
        passageContent: input.passageContent ?? null,
        passageFormat: input.passageFormat ?? null,
        caseSensitive: input.caseSensitive,
        partialCredit: input.partialCredit,
        playbackMode: input.playbackMode ?? null,
        showTranscriptAfterSubmit: input.showTranscriptAfterSubmit ?? false,
        writingPrompt: input.writingPrompt ?? null,
        letterTone: input.letterTone ?? null,
        wordCountMin: input.wordCountMin ?? null,
        wordCountMax: input.wordCountMax ?? null,
        wordCountMode: input.wordCountMode ?? null,
        sampleResponse: input.sampleResponse ?? null,
        showSampleAfterGrading: input.showSampleAfterGrading ?? false,
        speakingPrepTime: input.speakingPrepTime ?? null,
        speakingTime: input.speakingTime ?? null,
        maxRecordingDuration: input.maxRecordingDuration ?? null,
        enableTranscription: input.enableTranscription ?? false,
        timeLimit: input.timeLimit ?? null,
        timerPosition: input.timerPosition ?? null,
        warningAlerts: input.warningAlerts ?? Prisma.DbNull,
        autoSubmitOnExpiry: input.autoSubmitOnExpiry ?? true,
        gracePeriodSeconds: input.gracePeriodSeconds ?? null,
        enablePause: input.enablePause ?? false,
        bandLevel: input.bandLevel ?? null,
        createdById: authAccount.userId,
      },
      include: EXERCISE_INCLUDE,
    });
  }

  private async updateDraftExercise(
    centerId: string,
    id: string,
    input: UpdateExerciseInput | AutosaveExerciseInput,
    errorMessage: string,
  ): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await this.verifyDraftExercise(db, id, errorMessage);

    // Cross-field validation: wordCountMax >= wordCountMin after merging with DB state
    const effectiveMin =
      "wordCountMin" in input && input.wordCountMin !== undefined
        ? input.wordCountMin
        : exercise.wordCountMin;
    const effectiveMax =
      "wordCountMax" in input && input.wordCountMax !== undefined
        ? input.wordCountMax
        : exercise.wordCountMax;
    if (
      effectiveMin != null &&
      effectiveMax != null &&
      effectiveMax < effectiveMin
    ) {
      throw AppError.badRequest("wordCountMax must be >= wordCountMin");
    }

    return await db.exercise.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.instructions !== undefined && {
          instructions: input.instructions,
        }),
        ...(input.passageContent !== undefined && {
          passageContent: input.passageContent,
        }),
        ...(input.passageFormat !== undefined && {
          passageFormat: input.passageFormat,
        }),
        ...("caseSensitive" in input &&
          input.caseSensitive !== undefined && {
            caseSensitive: input.caseSensitive,
          }),
        ...("partialCredit" in input &&
          input.partialCredit !== undefined && {
            partialCredit: input.partialCredit,
          }),
        ...("audioDuration" in input &&
          input.audioDuration !== undefined && {
            audioDuration: input.audioDuration,
          }),
        ...("playbackMode" in input &&
          input.playbackMode !== undefined && {
            playbackMode: input.playbackMode,
          }),
        ...("audioSections" in input &&
          input.audioSections !== undefined && {
            audioSections:
              input.audioSections === null
                ? Prisma.DbNull
                : (input.audioSections as Prisma.InputJsonValue),
          }),
        ...("showTranscriptAfterSubmit" in input &&
          input.showTranscriptAfterSubmit !== undefined && {
            showTranscriptAfterSubmit: input.showTranscriptAfterSubmit,
          }),
        ...("writingPrompt" in input &&
          input.writingPrompt !== undefined && {
            writingPrompt: input.writingPrompt,
          }),
        ...("letterTone" in input &&
          input.letterTone !== undefined && {
            letterTone: input.letterTone,
          }),
        ...("wordCountMin" in input &&
          input.wordCountMin !== undefined && {
            wordCountMin: input.wordCountMin,
          }),
        ...("wordCountMax" in input &&
          input.wordCountMax !== undefined && {
            wordCountMax: input.wordCountMax,
          }),
        ...("wordCountMode" in input &&
          input.wordCountMode !== undefined && {
            wordCountMode: input.wordCountMode,
          }),
        ...("sampleResponse" in input &&
          input.sampleResponse !== undefined && {
            sampleResponse: input.sampleResponse,
          }),
        ...("showSampleAfterGrading" in input &&
          input.showSampleAfterGrading !== undefined && {
            showSampleAfterGrading: input.showSampleAfterGrading,
          }),
        ...("speakingPrepTime" in input &&
          input.speakingPrepTime !== undefined && {
            speakingPrepTime: input.speakingPrepTime,
          }),
        ...("speakingTime" in input &&
          input.speakingTime !== undefined && {
            speakingTime: input.speakingTime,
          }),
        ...("maxRecordingDuration" in input &&
          input.maxRecordingDuration !== undefined && {
            maxRecordingDuration: input.maxRecordingDuration,
          }),
        ...("enableTranscription" in input &&
          input.enableTranscription !== undefined && {
            enableTranscription: input.enableTranscription,
          }),
        ...("timeLimit" in input &&
          input.timeLimit !== undefined && {
            timeLimit: input.timeLimit,
          }),
        ...("timerPosition" in input &&
          input.timerPosition !== undefined && {
            timerPosition: input.timerPosition,
          }),
        ...("warningAlerts" in input &&
          input.warningAlerts !== undefined && {
            warningAlerts:
              input.warningAlerts === null
                ? Prisma.DbNull
                : (input.warningAlerts as Prisma.InputJsonValue),
          }),
        ...("autoSubmitOnExpiry" in input &&
          input.autoSubmitOnExpiry !== undefined && {
            autoSubmitOnExpiry: input.autoSubmitOnExpiry,
          }),
        ...("gracePeriodSeconds" in input &&
          input.gracePeriodSeconds !== undefined && {
            gracePeriodSeconds: input.gracePeriodSeconds,
          }),
        ...("enablePause" in input &&
          input.enablePause !== undefined && {
            enablePause: input.enablePause,
          }),
        ...("bandLevel" in input &&
          input.bandLevel !== undefined && {
            bandLevel: input.bandLevel,
          }),
      },
      include: EXERCISE_INCLUDE,
    });
  }

  async updateExercise(
    centerId: string,
    id: string,
    input: UpdateExerciseInput,
  ): Promise<Exercise> {
    return this.updateDraftExercise(
      centerId,
      id,
      input,
      "Only draft exercises can be fully edited",
    );
  }

  async autosaveExercise(
    centerId: string,
    id: string,
    input: AutosaveExerciseInput,
  ): Promise<Exercise> {
    return this.updateDraftExercise(
      centerId,
      id,
      input,
      "Only draft exercises can be auto-saved",
    );
  }

  async deleteExercise(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(
      db,
      id,
      "Only draft exercises can be deleted",
    );

    await db.exercise.delete({ where: { id } });
  }

  async publishExercise(centerId: string, id: string): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    await this.verifyDraftExercise(
      db,
      id,
      "Only draft exercises can be published",
    );

    return await db.exercise.update({
      where: { id },
      data: { status: "PUBLISHED" },
      include: EXERCISE_INCLUDE,
    });
  }

  async archiveExercise(centerId: string, id: string): Promise<Exercise> {
    const db = getTenantedClient(this.prisma, centerId);

    const exercise = await db.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw AppError.notFound("Exercise not found");
    }
    if (exercise.status === "ARCHIVED") {
      throw AppError.badRequest("Exercise is already archived");
    }

    return await db.exercise.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: EXERCISE_INCLUDE,
    });
  }

  async uploadAudio(
    centerId: string,
    exerciseId: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ audioUrl: string }> {
    if (!this.firebaseStorage || !this.bucketName) {
      throw new Error("Storage not configured");
    }

    const db = getTenantedClient(this.prisma, centerId);
    await this.verifyDraftExercise(
      db,
      exerciseId,
      "Only draft exercises can have audio uploaded",
    );

    const mimeToExt: Record<string, string> = {
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
    };
    const ext = mimeToExt[contentType] ?? "mp3";
    const bucket = this.firebaseStorage.bucket(this.bucketName);
    const filePath = `exercises/${centerId}/${exerciseId}/audio/${Date.now()}.${ext}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    await file.makePublic();

    const audioUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    await db.exercise.update({
      where: { id: exerciseId },
      data: { audioUrl },
    });

    return { audioUrl };
  }

  async deleteAudio(centerId: string, exerciseId: string): Promise<void> {
    if (!this.firebaseStorage || !this.bucketName) {
      throw new Error("Storage not configured");
    }

    const db = getTenantedClient(this.prisma, centerId);
    const exercise = await this.verifyDraftExercise(
      db,
      exerciseId,
      "Only draft exercises can have audio removed",
    );

    if (exercise.audioUrl) {
      const bucket = this.firebaseStorage.bucket(this.bucketName);
      const prefix = `https://storage.googleapis.com/${bucket.name}/`;
      if (exercise.audioUrl.startsWith(prefix)) {
        const storagePath = exercise.audioUrl.slice(prefix.length);
        try {
          await bucket.file(storagePath).delete();
        } catch {
          // File may already be deleted — continue
        }
      }
    }

    await db.exercise.update({
      where: { id: exerciseId },
      data: {
        audioUrl: null,
        audioDuration: null,
        audioSections: Prisma.DbNull,
      },
    });

    // Clear audioSectionIndex on all related question sections
    await db.questionSection.updateMany({
      where: { exerciseId },
      data: { audioSectionIndex: null },
    });
  }

  async uploadStimulusImage(
    centerId: string,
    exerciseId: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ stimulusImageUrl: string }> {
    if (!this.firebaseStorage || !this.bucketName) {
      throw new Error("Storage not configured");
    }

    const db = getTenantedClient(this.prisma, centerId);
    await this.verifyDraftExercise(
      db,
      exerciseId,
      "Only draft exercises can have stimulus images uploaded",
    );

    const mimeToExt: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/svg+xml": "svg",
    };
    const ext = mimeToExt[contentType] ?? "png";
    const bucket = this.firebaseStorage.bucket(this.bucketName);
    const filePath = `exercises/${centerId}/${exerciseId}/stimulus-image/${Date.now()}.${ext}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    await file.makePublic();

    const stimulusImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    await db.exercise.update({
      where: { id: exerciseId },
      data: { stimulusImageUrl },
    });

    return { stimulusImageUrl };
  }

  async deleteStimulusImage(
    centerId: string,
    exerciseId: string,
  ): Promise<void> {
    if (!this.firebaseStorage || !this.bucketName) {
      throw new Error("Storage not configured");
    }

    const db = getTenantedClient(this.prisma, centerId);
    const exercise = await this.verifyDraftExercise(
      db,
      exerciseId,
      "Only draft exercises can have stimulus images removed",
    );

    if (exercise.stimulusImageUrl) {
      const bucket = this.firebaseStorage.bucket(this.bucketName);
      const prefix = `https://storage.googleapis.com/${bucket.name}/`;
      if (exercise.stimulusImageUrl.startsWith(prefix)) {
        const storagePath = exercise.stimulusImageUrl.slice(prefix.length);
        try {
          await bucket.file(storagePath).delete();
        } catch {
          // File may already be deleted — continue
        }
      }
    }

    await db.exercise.update({
      where: { id: exerciseId },
      data: { stimulusImageUrl: null },
    });
  }

  async uploadDiagram(
    centerId: string,
    exerciseId: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.firebaseStorage || !this.bucketName) {
      throw new Error("Storage not configured");
    }

    const ext = contentType.split("/")[1]?.replace("svg+xml", "svg") ?? "png";
    const bucket = this.firebaseStorage.bucket(this.bucketName);
    const filePath = `exercises/${centerId}/${exerciseId}/diagrams/${Date.now()}.${ext}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  }
}
