// Shared transactional mailer. Sends account credentials, password resets and
// digests through an SMTP server (Hostinger).
//
// Configure via environment variables:
//   SMTP_HOST   e.g. smtp.hostinger.com
//   SMTP_PORT   465 (implicit TLS) or 587 (STARTTLS). Defaults to 465.
//   SMTP_USER   the full mailbox address, e.g. no-reply@theway.ge
//   SMTP_PASS   that mailbox's password
//   EMAIL_FROM  display sender, e.g. "The Way <no-reply@theway.ge>"
//
// Sending is best-effort at every call site: failures are caught and surfaced
// as a warning, never as a hard error, so account creation still succeeds if
// mail is temporarily unavailable.
import nodemailer, { type Transporter } from 'nodemailer';

let cached: Transporter | null = null;

const readConfig = () => ({
  host: String(process.env.SMTP_HOST || '').trim(),
  user: String(process.env.SMTP_USER || '').trim(),
  pass: String(process.env.SMTP_PASS || '').trim(),
  port: Number(process.env.SMTP_PORT || 465),
});

export const mailerConfigured = (): boolean => {
  const { host, user, pass } = readConfig();
  return Boolean(host && user && pass);
};

const getTransporter = (): Transporter | null => {
  const { host, user, pass, port } = readConfig();
  if (!host || !user || !pass) return null;
  if (!cached) {
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 negotiates STARTTLS
      auth: { user, pass },
    });
  }
  return cached;
};

export const sendMail = async (to: string, subject: string, html: string, text: string): Promise<void> => {
  const transporter = getTransporter();
  if (!transporter) throw new Error('SMTP is not configured');
  const from = process.env.EMAIL_FROM || 'The Way <no-reply@theway.ge>';
  await transporter.sendMail({ from, to, subject, html, text });
};
