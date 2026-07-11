import { tryGetSupabase } from './supabase';

/** Uploads a file via the backend and returns its permanent URL. */
export async function uploadFileToStorage(file: File): Promise<string> {
  const supabase = tryGetSupabase();
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
  const endpoint = (import.meta.env as { VITE_FILE_UPLOAD_WEBHOOK?: string }).VITE_FILE_UPLOAD_WEBHOOK || '/api/upload-file';
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64 }),
  });
  const json = await resp.json().catch(() => null) as { url?: string; error?: string } | null;
  if (!resp.ok || !json?.url) throw new Error(json?.error ?? 'Upload failed');
  return json.url;
}
