type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  res.status(410).json({ error: '2FA is disabled' });
}
