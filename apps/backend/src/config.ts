import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  DEMO_MODE: z.string().default('true').transform((value) => value === 'true'),
  MIDNIGHT_INDEXER_URL: z.string().url().optional(),
  MIDNIGHT_CONTRACT_ADDRESS: z.string().min(1).optional(),
});

export const config = environmentSchema.parse(process.env);
