import type { Page } from "@playwright/test";

function getBackendUrl(): string {
  return process.env.VITE_API_URL || "http://localhost:4000";
}

async function getAuthToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  if (!token) throw new Error("No auth token found — is the user logged in?");
  return token;
}

/**
 * Get the seeded student's ID via the backend API.
 * Searches users by the student test email.
 */
export async function getStudentIdViaAPI(page: Page): Promise<string> {
  const token = await getAuthToken(page);
  const studentEmail =
    process.env.E2E_STUDENT_EMAIL || "student@test.classlite.com";

  const response = await page.request.get(
    `${getBackendUrl()}/api/v1/users?email=${encodeURIComponent(studentEmail)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok()) {
    throw new Error(`Failed to get users: ${response.status()}`);
  }
  const body = await response.json();
  const users = body.data ?? body;
  const list = Array.isArray(users) ? users : users.items ?? [];
  const student = list.find(
    (u: { email?: string }) => u.email === studentEmail
  );
  if (!student) {
    throw new Error(`Student user not found: ${studentEmail}`);
  }
  return student.id;
}

/**
 * Create a student flag as TEACHER via API.
 */
export async function createFlagViaAPI(
  page: Page,
  studentId: string,
  note: string
): Promise<{ flagId: string }> {
  const token = await getAuthToken(page);
  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/student-health/flags`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { studentId, note },
    }
  );
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create flag: ${response.status()} ${body}`);
  }
  const body = await response.json();
  const data = body.data ?? body;
  return { flagId: data.flagId ?? data.id };
}

/**
 * Resolve a student flag as OWNER/ADMIN via API.
 */
export async function resolveFlagViaAPI(
  page: Page,
  flagId: string,
  resolvedNote?: string
): Promise<void> {
  const token = await getAuthToken(page);
  const response = await page.request.patch(
    `${getBackendUrl()}/api/v1/student-health/flags/${flagId}/resolve`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { resolvedNote: resolvedNote ?? "" },
    }
  );
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to resolve flag: ${response.status()} ${body}`);
  }
}

/**
 * Send an intervention email via API.
 */
export async function sendInterventionViaAPI(
  page: Page,
  studentId: string,
  data: {
    recipientEmail: string;
    subject: string;
    body: string;
    templateUsed?: string;
  }
): Promise<{ interventionId: string }> {
  const token = await getAuthToken(page);
  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/student-health/interventions`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId,
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        body: data.body,
        templateUsed: data.templateUsed ?? "concern-general",
      },
    }
  );
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to send intervention: ${response.status()} ${body}`
    );
  }
  const resBody = await response.json();
  const resData = resBody.data ?? resBody;
  return { interventionId: resData.interventionId ?? resData.id };
}

/**
 * Get an intervention email preview via API.
 */
export async function getInterventionPreviewViaAPI(
  page: Page,
  studentId: string,
  template: string = "concern-general"
): Promise<{ recipientEmail: string | null; subject: string; body: string }> {
  const token = await getAuthToken(page);
  const response = await page.request.get(
    `${getBackendUrl()}/api/v1/student-health/interventions/${studentId}/preview?template=${template}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok()) {
    throw new Error(`Failed to get preview: ${response.status()}`);
  }
  const body = await response.json();
  const data = body.data ?? body;
  return {
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    body: data.body,
  };
}
