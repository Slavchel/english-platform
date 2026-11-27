import { NextResponse } from "next/server";

const TOPICS = [
  "Проблема с оплатой",
  "Технический сбой",
  "Вопрос по обучению",
  "Другое",
] as const;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentRequests = new Map<string, number[]>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const attempts = (recentRequests.get(ip) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );
  if (attempts.length >= RATE_LIMIT_MAX) {
    recentRequests.set(ip, attempts);
    return true;
  }
  attempts.push(now);
  recentRequests.set(ip, attempts);
  return false;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Слишком много обращений. Попробуйте позже." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const topic = String(input.topic ?? "").trim();
  const message = String(input.message ?? "").trim();

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json(
      { error: "Укажите имя (от 2 до 100 символов)." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return NextResponse.json(
      { error: "Укажите корректный email." },
      { status: 400 },
    );
  }
  if (!TOPICS.includes(topic as (typeof TOPICS)[number])) {
    return NextResponse.json(
      { error: "Выберите тему обращения." },
      { status: 400 },
    );
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: "Сообщение должно содержать от 10 до 5000 символов." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[support] RESEND_API_KEY is not configured");
    return NextResponse.json(
      { error: "Отправка временно недоступна." },
      { status: 503 },
    );
  }

  const to = process.env.SUPPORT_EMAIL?.trim() || "support@neoleng.ru";
  const from =
    process.env.SUPPORT_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "NeoLeng <noreply@neoleng.ru>";
  const safeText = [
    "Новое обращение в поддержку NeoLeng",
    "",
    `Имя: ${name}`,
    `Email: ${email}`,
    `Тема: ${topic}`,
    "",
    message,
  ].join("\n");
  const safeHtml = `
    <h2>Новое обращение в поддержку NeoLeng</h2>
    <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Тема:</strong> ${escapeHtml(topic)}</p>
    <hr />
    <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "NeoLeng/1.0",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[NeoLeng Support] ${topic}`,
        text: safeText,
        html: safeHtml,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[support] Resend rejected the message", response.status);
      return NextResponse.json(
        { error: "Не удалось отправить обращение. Попробуйте позже." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[support] Resend request failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Не удалось отправить обращение. Попробуйте позже." },
      { status: 502 },
    );
  }
}
