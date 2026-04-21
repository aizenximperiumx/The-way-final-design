import { tryGetSupabase } from './supabase';

export type MailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendMail(payload: MailPayload): Promise<void> {
  try {
    const env = import.meta.env as { VITE_EMAIL_WEBHOOK?: string };
    const url = env.VITE_EMAIL_WEBHOOK || '/api/send-email';
    if (!url) return;
    const supabase = tryGetSupabase();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return;
  }
}
