import { inngest } from "./client.js";
import { testHelloFunction } from "./test-function.js";
import { userDeletionJob } from "../users/jobs/user-deletion.job.js";

// Export functions array - all Inngest functions must be registered here
export const functions: ReturnType<typeof inngest.createFunction>[] = [
  testHelloFunction,
  userDeletionJob,
];
