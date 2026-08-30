import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  DEMO_MODE: z.string().default('true').transform((value) => value === 'true'),
  MIDNIGHT_INDEXER_URL: optionalUrl,
  MIDNIGHT_CONTRACT_ADDRESS: optionalString,
});

export const config = environmentSchema.parse(process.env);
