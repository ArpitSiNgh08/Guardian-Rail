import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const assetsRoot = path.resolve(process.cwd(), '../../contracts/guardian-rail/managed/guardian-rail');
const allowedPath = /^(keys|zkir)\/(?:[a-zA-Z0-9_-]+)\.(?:prover|verifier|bzkir)$/;

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const segments = (await context.params).path;
  const relativePath = segments.join('/');
  if (!allowedPath.test(relativePath)) {
    return NextResponse.json({ error: 'Unknown contract asset.' }, { status: 404 });
  }

  const assetPath = path.resolve(assetsRoot, relativePath);
  if (!assetPath.startsWith(`${assetsRoot}${path.sep}`)) {
    return NextResponse.json({ error: 'Invalid contract asset path.' }, { status: 400 });
  }

  try {
    const asset = await readFile(assetPath);
    const contentType = relativePath.endsWith('.bzkir') ? 'application/octet-stream' : 'application/octet-stream';
    return new NextResponse(asset, {
      headers: {
        'Content-Type': contentType,
        // Compiling a contract replaces these files. Never let a stale development
        // response survive a recompile; production can add content-hashed URLs later.
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Contract asset is not available. Compile the contract first.' }, { status: 404 });
  }
}
