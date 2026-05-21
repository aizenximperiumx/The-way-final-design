export async function resolveStorageUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
  try {
    const url = new URL(fileUrl);
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
    if (!supabaseUrl) return fileUrl;
    const supabaseHost = new URL(supabaseUrl).host;
    if (url.host !== supabaseHost) return fileUrl;

    const segments = url.pathname.split('/').filter(Boolean);
    const publicIndex = segments.indexOf('public');
    if (segments[0] !== 'storage' || segments[1] !== 'v1' || segments[2] !== 'object' || publicIndex === -1 || publicIndex + 2 >= segments.length) {
      return fileUrl;
    }

    const resp = await fetch('/api/sign-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl, expiresIn }),
    });
    if (!resp.ok) return fileUrl;
    const json = await resp.json().catch(() => null) as { signedUrl?: string } | null;
    return json?.signedUrl ?? fileUrl;
  } catch {
    return fileUrl;
  }
}

export async function openStorageUrl(fileUrl: string, expiresIn = 3600): Promise<void> {
  const resolved = await resolveStorageUrl(fileUrl, expiresIn);
  window.open(resolved, '_blank');
}
