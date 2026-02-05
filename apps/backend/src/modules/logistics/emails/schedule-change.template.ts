import {
  escapeHtml,
  formatDateTime,
  formatTime,
} from "./format-utils.js";

interface ScheduleChangeEmailParams {
  courseName: string;
  className: string;
  oldStartTime: Date;
  oldEndTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  oldRoomName?: string | null;
  newRoomName?: string | null;
  scheduleUrl: string;
  centerName: string;
  recipientName: string | null;
  locale: "en" | "vi";
}

export function buildScheduleChangeEmail(
  params: ScheduleChangeEmailParams,
): { subject: string; html: string } {
  const {
    oldStartTime,
    oldEndTime,
    newStartTime,
    newEndTime,
    scheduleUrl,
    locale,
  } = params;

  // Escape user-controlled strings for safe HTML rendering
  const centerName = escapeHtml(params.centerName);
  const courseName = escapeHtml(params.courseName);
  const className = escapeHtml(params.className);
  const recipientName = params.recipientName
    ? escapeHtml(params.recipientName)
    : null;
  const oldRoomName = params.oldRoomName
    ? escapeHtml(params.oldRoomName)
    : null;
  const newRoomName = params.newRoomName
    ? escapeHtml(params.newRoomName)
    : null;

  const roomChanged =
    params.oldRoomName !== params.newRoomName &&
    (params.oldRoomName || params.newRoomName);

  // Subject is plain text — no HTML escaping needed
  const subject =
    locale === "vi"
      ? `Lịch học thay đổi: ${params.courseName} - ${params.className}`
      : `Schedule Changed: ${params.courseName} - ${params.className}`;

  const greeting = recipientName
    ? locale === "vi"
      ? `Xin chào ${recipientName},`
      : `Hi ${recipientName},`
    : locale === "vi"
      ? "Xin chào,"
      : "Hi,";

  const intro =
    locale === "vi"
      ? `Lịch học của lớp <strong>${courseName} - ${className}</strong> đã được thay đổi.`
      : `The schedule for <strong>${courseName} - ${className}</strong> has been updated.`;

  const oldLabel = locale === "vi" ? "Lịch cũ" : "Previous";
  const newLabel = locale === "vi" ? "Lịch mới" : "Updated";
  const roomLabel = locale === "vi" ? "Phòng" : "Room";
  const buttonText =
    locale === "vi" ? "Xem Lịch Học" : "View Schedule";
  const footer =
    locale === "vi"
      ? `Bạn nhận được email này vì bạn là thành viên của ${centerName}.`
      : `You received this email because you are a member of ${centerName}.`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#2563EB;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${centerName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#18181b;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:16px;color:#18181b;">${intro}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;">${oldLabel}</p>
                    <p style="margin:0;font-size:14px;color:#18181b;">${formatDateTime(oldStartTime, locale)} – ${formatTime(oldEndTime, locale)}</p>
                    ${oldRoomName ? `<p style="margin:4px 0 0;font-size:13px;color:#71717a;">${roomLabel}: ${oldRoomName}</p>` : ""}
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;">${newLabel}</p>
                    <p style="margin:0;font-size:14px;color:#18181b;">${formatDateTime(newStartTime, locale)} – ${formatTime(newEndTime, locale)}</p>
                    ${newRoomName ? `<p style="margin:4px 0 0;font-size:13px;color:#71717a;">${roomLabel}: ${newRoomName}</p>` : ""}
                  </td>
                </tr>
              </table>

              ${roomChanged ? `<p style="margin:0 0 24px;font-size:14px;color:#71717a;">${locale === "vi" ? "Phòng học cũng đã thay đổi." : "The room has also been changed."}</p>` : ""}

              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#2563EB;border-radius:6px;">
                    <a href="${scheduleUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${buttonText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f4f4f5;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
