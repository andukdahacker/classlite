import { inngest } from "./client.js";
import { testHelloFunction } from "./test-function.js";
import { userDeletionJob } from "../users/jobs/user-deletion.job.js";
import { csvImportJob } from "../users/jobs/csv-import.job.js";
import {
  sessionEmailNotificationJob,
  sessionCancellationEmailJob,
} from "../logistics/jobs/session-email-notification.job.js";
import { questionGenerationJob } from "../exercises/jobs/question-generation.job.js";

// Export functions array - all Inngest functions must be registered here
export const functions: ReturnType<typeof inngest.createFunction>[] = [
  testHelloFunction,
  userDeletionJob,
  csvImportJob,
  sessionEmailNotificationJob,
  sessionCancellationEmailJob,
  questionGenerationJob,
];
