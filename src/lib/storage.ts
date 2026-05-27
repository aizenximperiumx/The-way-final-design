export async function resolveStorageUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
  if (!fileUrl) return fileUrl;
  try {
    // Always attempt server-side signing — the server knows whether the URL belongs
    // to the configured Supabase project and will fall back gracefully if it doesn't.
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
