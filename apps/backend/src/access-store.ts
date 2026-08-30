import { randomBytes, randomUUID } from 'node:crypto';

export type AccessStatus = 'locked' | 'unlocked';

export interface AccessSession {
  readonly id: string;
  readonly contextId: string;
  readonly status: AccessStatus;
  readonly createdAt: string;
  readonly nullifier?: string;
}

export class AccessStore {
  private readonly sessions = new Map<string, AccessSession>();
  private readonly spentNullifiers = new Set<string>();

  createSession(): AccessSession {
    const id = randomUUID();
    const session: AccessSession = {
      id,
      // `proveAge` accepts a Compact `Bytes<32>` context. UUIDs provide only
      // 16 bytes, so use a cryptographically random 32-byte domain value.
      contextId: randomBytes(32).toString('hex'),
      status: 'locked',
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): AccessSession | undefined {
    return this.sessions.get(id);
  }

  unlock(sessionId: string, nullifier: string): AccessSession | 'missing' | 'replayed' {
    const session = this.sessions.get(sessionId);
    if (!session) return 'missing';
    if (this.spentNullifiers.has(nullifier)) return 'replayed';

    this.spentNullifiers.add(nullifier);
    const unlockedSession: AccessSession = { ...session, status: 'unlocked', nullifier };
    this.sessions.set(sessionId, unlockedSession);
    return unlockedSession;
  }
}
