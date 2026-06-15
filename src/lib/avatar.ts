// Lightweight profile-photo storage. Photos are downscaled to a small square
// and kept in localStorage keyed by user id (survives logout, device-local).
// A DB-backed avatar column can replace this later without touching callers.

const keyFor = (id: string) => `tw-avatar-${id}`;
const EVENT = 'tw-avatar-changed';

export function getAvatar(userId?: string | null): string {
  if (!userId) return '';
  try { return localStorage.getItem(keyFor(userId)) || ''; } catch { return ''; }
}

export function setAvatar(userId: string, dataUrl: string): void {
  try { localStorage.setItem(keyFor(userId), dataUrl); } catch { /* quota */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: userId }));
}

export function clearAvatar(userId: string): void {
  try { localStorage.removeItem(keyFor(userId)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: userId }));
}

export function onAvatarChange(handler: () => void): () => void {
  const fn = () => handler();
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

// Read an image File, downscale to a square `size`px, return a JPEG data URL.
export function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Please choose an image file')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load the image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Image processing not supported')); return; }
        // center-crop to a square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  });
}
