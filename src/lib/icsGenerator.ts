const escapeICS = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

function foldLine(line: string): string {
  const lines: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 74) {
      lines.push(current);
      current = " " + char;
      bytes = size + 1;
    } else {
      current += char;
      bytes += size;
    }
  }
  lines.push(current);
  return lines.join("\r\n");
}

export function buildICS(title: string, date: string, description: string): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "2026-11-05";
  const candidate = new Date(`${day}T00:00:00.000Z`);
  const start = Number.isFinite(candidate.getTime()) && candidate.toISOString().slice(0, 10) === day ? candidate : new Date("2026-11-05T00:00:00.000Z");
  const end = new Date(start.getTime() + 86400000);
  const formatDay = (value: Date) => value.toISOString().slice(0, 10).replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NIRVAXIS//Evidence Engine//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:${uid}@nirvaxis.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${formatDay(start)}`, `DTEND;VALUE=DATE:${formatDay(end)}`, `SUMMARY:${escapeICS(title)}`, `DESCRIPTION:${escapeICS(description + "\nWorkflow reminder only. Verify the actual legal deadline with the issuing authority.")}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${escapeICS(title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}

export function downloadFile(content: string, filename: string, type = "text/plain;charset=utf-8") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadICS(title: string, date: string, description: string) {
  downloadFile(buildICS(title, date, description), "nirvaxis-case-reminder.ics", "text/calendar;charset=utf-8");
}
