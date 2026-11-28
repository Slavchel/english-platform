import nodemailer from "nodemailer";

export const DEFAULT_EMAIL_FROM = "NeoLeng <no-reply@neoleng.ru>";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls: {
    minVersion: "TLSv1.2";
  };
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const portValue = Number(process.env.SMTP_PORT ?? "465");
  const port = Number.isInteger(portValue) ? portValue : 465;

  if (!host || !user || !pass) return null;

  return {
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user,
      pass,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export async function sendSmtpMail({
  to,
  subject,
  text,
  html,
  replyTo,
  from,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  from?: string;
}): Promise<void> {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP is not configured");
  }

  const transport = nodemailer.createTransport(config);
  try {
    await transport.sendMail({
      from: from ?? getEmailFrom(),
      to,
      subject,
      text,
      html,
      replyTo,
    });
  } finally {
    transport.close();
  }
}
