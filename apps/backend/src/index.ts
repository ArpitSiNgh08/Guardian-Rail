import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { AccessStore } from './access-store.js';
import { config } from './config.js';
import { DemoProofVerifier } from './proof-verifier.js';

const proofSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  contextId: z.string().regex(/^[a-f0-9]{32}$/i),
  nullifier: z.string().regex(/^[a-f0-9]{64}$/i),
  disclosed: z.literal(true),
});

const app = express();
const accessStore = new AccessStore();
const proofVerifier = new DemoProofVerifier();

app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', mode: config.DEMO_MODE ? 'demo' : 'indexer' });
});

app.post('/api/sessions', (_request, response) => {
  response.status(201).json(accessStore.createSession());
});

app.get('/api/sessions/:sessionId/access', (request, response) => {
  const session = accessStore.getSession(request.params.sessionId);
  if (!session) return response.status(404).json({ error: 'Unknown session.' });
  return response.json({ sessionId: session.id, contextId: session.contextId, status: session.status });
});

app.post('/api/proofs', async (request, response) => {
  const parsed = proofSubmissionSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: 'Invalid proof submission.' });

  const session = accessStore.getSession(parsed.data.sessionId);
  if (!session || session.contextId !== parsed.data.contextId) {
    return response.status(404).json({ error: 'Unknown proof context.' });
  }

  const isValid = await proofVerifier.verify(parsed.data);
  if (!isValid) return response.status(403).json({ error: 'Proof was not accepted.' });

  const result = accessStore.unlock(session.id, parsed.data.nullifier);
  if (result === 'replayed') return response.status(409).json({ error: 'This proof has already been used.' });
  if (result === 'missing') return response.status(404).json({ error: 'Unknown session.' });

  return response.status(201).json({ sessionId: result.id, status: result.status });
});

app.listen(config.PORT, () => {
  console.log(`Guardian Rail backend listening on http://localhost:${config.PORT}`);
});
