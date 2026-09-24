import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { smtpConfig } from "@/lib/env.server";
import type { EmailMessage } from "@/lib/email/templates";

let transporter: Transporter | null = null;

/**
 * Sends one notification email over SMTP (FR-M18-09, FR-M19-09). A
 * notification never breaks the action that triggered it: without SMTP
 * settings nothing is sent, and failures only reach the server log.
 */
export async function sendEmail(to: string, message: EmailMessage): Promise<void> {
  const config = smtpConfig();
  if (!config || !to) return;

  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.auth,
  });

  try {
    await transporter.sendMail({ from: config.from, to, ...message });
  } catch (error) {
    console.error(
      `notification email failed (${message.subject}):`,
      error instanceof Error ? error.message : error,
    );
  }
}
