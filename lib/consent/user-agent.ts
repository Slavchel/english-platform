export function summarizeUserAgent(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "Unknown";

  let browser = "Other";
  if (/YaBrowser/i.test(raw)) browser = "Yandex Browser";
  else if (/Edg\//i.test(raw)) browser = "Edge";
  else if (/OPR\//i.test(raw)) browser = "Opera";
  else if (/Firefox\//i.test(raw)) browser = "Firefox";
  else if (/Chrome\//i.test(raw)) browser = "Chrome";
  else if (/Safari\//i.test(raw)) browser = "Safari";

  let os = "Other";
  if (/Windows/i.test(raw)) os = "Windows";
  else if (/Android/i.test(raw)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(raw)) os = "iOS";
  else if (/Mac OS X|Macintosh/i.test(raw)) os = "macOS";
  else if (/Linux/i.test(raw)) os = "Linux";

  return `${browser} / ${os}`.slice(0, 255);
}
