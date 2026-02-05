import { describe, it, expect } from "vitest";
import { buildScheduleChangeEmail } from "./schedule-change.template.js";
import { buildSessionCancelledEmail } from "./session-cancelled.template.js";

describe("buildScheduleChangeEmail", () => {
  const baseParams = {
    courseName: "IELTS Foundation",
    className: "Class 10A",
    oldStartTime: new Date("2026-02-10T09:00:00Z"),
    oldEndTime: new Date("2026-02-10T10:30:00Z"),
    newStartTime: new Date("2026-02-11T14:00:00Z"),
    newEndTime: new Date("2026-02-11T15:30:00Z"),
    oldRoomName: "Room A",
    newRoomName: "Room B",
    scheduleUrl: "http://localhost:5173/center1/logistics/scheduler",
    centerName: "Test Center",
    recipientName: "John Doe",
    locale: "en" as const,
  };

  it("renders with all fields populated", () => {
    const { subject, html } = buildScheduleChangeEmail(baseParams);

    expect(subject).toBe("Schedule Changed: IELTS Foundation - Class 10A");
    expect(html).toContain("IELTS Foundation");
    expect(html).toContain("Class 10A");
    expect(html).toContain("Hi John Doe,");
    expect(html).toContain("Room A");
    expect(html).toContain("Room B");
    expect(html).toContain("Test Center");
  });

  it("includes deep-link URL", () => {
    const { html } = buildScheduleChangeEmail(baseParams);

    expect(html).toContain(
      "http://localhost:5173/center1/logistics/scheduler",
    );
    expect(html).toContain("View Schedule");
  });

  it("renders Vietnamese locale", () => {
    const { subject, html } = buildScheduleChangeEmail({
      ...baseParams,
      locale: "vi",
    });

    expect(subject).toContain("Lịch học thay đổi");
    expect(html).toContain("Xin chào John Doe,");
    expect(html).toContain("Xem Lịch Học");
  });

  it("renders without room names", () => {
    const { html } = buildScheduleChangeEmail({
      ...baseParams,
      oldRoomName: null,
      newRoomName: null,
    });

    expect(html).not.toContain("Room:");
  });

  it("uses generic greeting when recipientName is null", () => {
    const { html } = buildScheduleChangeEmail({
      ...baseParams,
      recipientName: null,
    });

    expect(html).toContain("Hi,");
    expect(html).not.toContain("Hi null");
  });

  it("includes button with correct brand color", () => {
    const { html } = buildScheduleChangeEmail(baseParams);

    expect(html).toContain("background-color:#2563EB");
  });
});

describe("buildSessionCancelledEmail", () => {
  const baseParams = {
    courseName: "IELTS Foundation",
    className: "Class 10A",
    originalStartTime: new Date("2026-02-10T09:00:00Z"),
    originalEndTime: new Date("2026-02-10T10:30:00Z"),
    roomName: "Room A",
    scheduleUrl: "http://localhost:5173/center1/logistics/scheduler",
    centerName: "Test Center",
    recipientName: "Jane Doe",
    locale: "en" as const,
    isBulk: false,
    deletedCount: undefined,
  };

  it("renders single session cancellation correctly", () => {
    const { subject, html } = buildSessionCancelledEmail(baseParams);

    expect(subject).toBe(
      "Session Cancelled: IELTS Foundation - Class 10A",
    );
    expect(html).toContain("Hi Jane Doe,");
    expect(html).toContain("has been cancelled");
    expect(html).toContain("Room A");
    expect(html).toContain("line-through");
  });

  it("renders bulk cancellation correctly", () => {
    const { subject, html } = buildSessionCancelledEmail({
      ...baseParams,
      isBulk: true,
      deletedCount: 5,
    });

    expect(subject).toContain("5 Sessions Cancelled");
    expect(html).toContain("<strong>5</strong> sessions");
    expect(html).toContain("have been cancelled");
  });

  it("includes deep-link URL", () => {
    const { html } = buildSessionCancelledEmail(baseParams);

    expect(html).toContain(
      "http://localhost:5173/center1/logistics/scheduler",
    );
  });

  it("renders Vietnamese locale for bulk cancellation", () => {
    const { subject, html } = buildSessionCancelledEmail({
      ...baseParams,
      locale: "vi",
      isBulk: true,
      deletedCount: 3,
    });

    expect(subject).toContain("3 buổi học đã bị hủy");
    expect(html).toContain("Xin chào Jane Doe,");
  });

  it("uses red header for cancellation", () => {
    const { html } = buildSessionCancelledEmail(baseParams);

    expect(html).toContain("background-color:#dc2626");
  });
});
