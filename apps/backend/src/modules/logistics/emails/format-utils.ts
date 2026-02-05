import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getLocale(lang: "en" | "vi") {
  return lang === "vi" ? vi : enUS;
}

export function formatDateTime(date: Date, lang: "en" | "vi"): string {
  return format(date, "EEEE, MMM d, yyyy 'at' h:mm a", {
    locale: getLocale(lang),
  });
}

export function formatTime(date: Date, lang: "en" | "vi"): string {
  return format(date, "h:mm a", { locale: getLocale(lang) });
}

export function formatDate(date: Date, lang: "en" | "vi"): string {
  return format(date, "MMM d, yyyy", { locale: getLocale(lang) });
}
