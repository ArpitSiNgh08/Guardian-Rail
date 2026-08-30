import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const allowedPath = /^(keys|zkir)\/(?:[a-zA-Z0-9_-]+)\.(?:prover|verifier|bzkir)$/;

const candidateRoots = [
  path.resolve(process.cwd(), 'public/contract-assets'),
  path.resolve(process.cwd(), 'apps/frontend/public/contract-assets'),
  path.resolve(process.cwd(), '../../contracts/guardian-rail/managed/guardian-rail'),
  path.resolve(process.cwd(), 'contracts/guardian-rail/managed/guardian-rail'),
];

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const segments = (await context.params).path;
  const relativePath = segments.join('/');
  if (!allowedPath.test(relativePath)) {
    return NextResponse.json({ error: 'Unknown contract asset.' }, { status: 404 });
  }

  for (const root of candidateRoots) {
    const assetPath = path.resolve(root, relativePath);
    if (!assetPath.startsWith(`${root}${path.sep}`)) {
      continue;
    }
    try {
      const asset = await readFile(/*turbopackIgnore: true*/ assetPath);
      return new NextResponse(asset, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    } catch {
      // Try next candidate root
    }
  }

  return NextResponse.json({ error: 'Contract asset is not available. Compile the contract first.' }, { status: 404 });
}
