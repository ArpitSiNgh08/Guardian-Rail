import cors from 'cors';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { AccessStore } from './access-store.js';
import { config } from './config.js';
import { IndexerProofVerifier } from './indexer-proof-verifier.js';

const generatedContractUrl = new URL(
  '../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js',
  import.meta.url,
).href;

function epochDays(isoDate: string) {
  return Math.floor(Date.parse(`${isoDate}T00:00:00.000Z`) / 86_400_000);
}

const proofSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  contextId: z.string().regex(/^[a-f0-9]{32}$/i),
  nullifier: z.string().regex(/^[a-f0-9]{64}$/i),
  transactionId: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  disclosed: z.literal(true),
});

const app = express();
const accessStore = new AccessStore();
const proofVerifier = config.DEMO_MODE
  ? undefined
  : config.MIDNIGHT_INDEXER_URL && config.MIDNIGHT_CONTRACT_ADDRESS
    ? new IndexerProofVerifier(config.MIDNIGHT_CONTRACT_ADDRESS, config.MIDNIGHT_INDEXER_URL)
    : undefined;

app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', mode: config.DEMO_MODE ? 'demo' : 'indexer' });
});

app.get('/api/deployment-config', async (_request, response) => {
  try {
    const keypair = JSON.parse(await readFile(config.ISSUER_KEYPAIR_PATH, 'utf8')) as { privateKeyHex?: string };
    if (!keypair.privateKeyHex || !/^[a-f0-9]{64}$/i.test(keypair.privateKeyHex)) {
      return response.status(500).json({ error: 'Issuer keypair is unavailable or invalid.' });
    }
    const guardianRailContract = await import(generatedContractUrl);
    const commitment = guardianRailContract.pureCircuits.issuerKeyCommitmentFor(Uint8Array.from(
      keypair.privateKeyHex.match(/../g)!,
      (pair) => Number.parseInt(pair, 16),
    ));
    return response.json({
      issuerKeyCommitment: Buffer.from(commitment).toString('hex'),
      minimumBirthDate: epochDays(config.POLICY_MINIMUM_BIRTH_DATE),
      policyVersion: 1,
    });
  } catch (error) {
    console.error('Unable to prepare Guardian Rail deployment configuration.', error);
    return response.status(500).json({ error: 'Unable to prepare deployment configuration.' });
  }
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

  if (!proofVerifier) return response.status(503).json({ error: 'Live Indexer verification is not configured.' });
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
