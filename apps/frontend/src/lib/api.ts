export type AccessStatus = 'locked' | 'unlocked';

export interface ProofSession {
  id: string;
  contextId: string;
  status: AccessStatus;
  createdAt: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'The request could not be completed.');
  }

  return response.json() as Promise<T>;
}

export function createSession() {
  return request<ProofSession>('/api/sessions', { method: 'POST' });
}

export function submitDemoProof(input: { sessionId: string; contextId: string; nullifier: string }) {
  return request<{ sessionId: string; status: AccessStatus }>('/api/proofs', {
    method: 'POST',
    body: JSON.stringify({ ...input, disclosed: true }),
  });
}
