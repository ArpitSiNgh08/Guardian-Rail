'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSession, submitDemoProof, type ProofSession } from '@/lib/api';
import { parseLocalCredential, type LocalCredential } from '@/midnight/credential';
import { createUserWitnesses } from '@/midnight/witnesses';
import { AnimatedGroup } from '../components/motion-primitives/animated-group';

const ageThreshold = 18;

function isAdult(dateOfBirth: string) {
  const birthday = new Date(`${dateOfBirth}T00:00:00`);
  const now = new Date();
  const cutoff = new Date(now.getFullYear() - ageThreshold, now.getMonth(), now.getDate());
  return !Number.isNaN(birthday.getTime()) && birthday <= cutoff;
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getLocalSecret() {
  const key = 'guardian-rail-demo-secret';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const secret = crypto.randomUUID();
  localStorage.setItem(key, secret);
  return secret;
}

export default function App() {
  const [session, setSession] = useState<ProofSession>();
  const [birthdate, setBirthdate] = useState('');
  const [credential, setCredential] = useState<LocalCredential>();
  const [status, setStatus] = useState<'idle' | 'proving' | 'unlocked'>('idle');
  const [error, setError] = useState<string>();

  useEffect(() => {
    createSession().then(setSession).catch((reason: Error) => setError(reason.message));
  }, []);

  function handleCredentialUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    void file.text().then((contents) => {
      try {
        setCredential(parseLocalCredential(JSON.parse(contents)));
        setError(undefined);
      } catch (reason) {
        setCredential(undefined);
        setError(reason instanceof Error ? reason.message : 'The selected credential is invalid.');
      }
    }).catch(() => {
      setCredential(undefined);
      setError('The selected credential could not be read.');
    });
  }

  async function handleProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    if (!session) return setError('A proof session is still being prepared.');
    const localBirthdate = credential?.birthdate ?? birthdate;
    if (!isAdult(localBirthdate)) return setError('This local credential does not meet the 18+ policy.');

    try {
      setStatus('proving');
      if (credential) createUserWitnesses(localStorage, credential);
      const nullifier = await sha256(`${getLocalSecret()}:${session.contextId}`);
      await submitDemoProof({ sessionId: session.id, contextId: session.contextId, nullifier });
      setStatus('unlocked');
    } catch (reason) {
      setStatus('idle');
      setError(reason instanceof Error ? reason.message : 'Proof submission failed.');
    }
  }

  const unlocked = status === 'unlocked';

  return (
    <AnimatedGroup as="main" asChild="div" preset="blur-slide" className="mx-auto grid min-h-screen max-w-5xl content-center gap-6 px-5 py-10 md:grid-cols-2">
      <section className="space-y-5">
        <Badge variant="secondary">Guardian Rail · local demo</Badge>
        <div className="space-y-3">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">Private access control</p>
          <h1 className="font-heading text-4xl font-bold tracking-tight">Prove eligibility, not identity.</h1>
          <p className="max-w-xl text-base">Guardian Rail lets an AI service receive a yes/no access decision without collecting your birthdate, ID, or photo.</p>
        </div>
        <Alert>
          <AlertTitle>Data stays on this device</AlertTitle>
          <AlertDescription>Your birthdate is checked in the browser and is never sent to this backend. This initial slice uses a demo verifier until the Midnight contract and Indexer are wired in.</AlertDescription>
        </Alert>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Age verification</CardTitle>
            <Badge variant={unlocked ? 'default' : 'secondary'}>{unlocked ? 'Access granted' : 'Chat locked'}</Badge>
          </div>
          <CardDescription>Prove that you meet the 18+ policy for this chat session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={handleProof}>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Date of birth</Label>
              <Input id="birthdate" type="date" value={credential?.birthdate ?? birthdate} onChange={(event) => setBirthdate(event.target.value)} required={!credential} disabled={unlocked || Boolean(credential)} />
              <p className="text-sm">Used locally to prepare a proof. It is not submitted to Guardian Rail.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credential">Local issuer credential (optional)</Label>
              <Input id="credential" type="file" accept="application/json,.json" onChange={handleCredentialUpload} disabled={unlocked} />
              <p className="text-sm">Select the credential JSON generated by the local issuer. It is read only in this browser.</p>
              {credential && <p className="text-sm font-bold text-primary">Local credential loaded. DOB and salt remain on this device.</p>}
            </div>
            <Button className="w-full" type="submit" disabled={!session || status === 'proving' || unlocked}>
              {status === 'proving' ? 'Generating local proof…' : unlocked ? 'Proof accepted' : 'Generate private proof'}
            </Button>
          </form>
          {error && <Alert variant="error"><AlertTitle>Unable to verify</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
        <CardFooter className="text-sm">{session ? `Session context: ${session.contextId.slice(0, 12)}…` : 'Creating private session…'}</CardFooter>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Companion chat</CardTitle>
          <CardDescription>{unlocked ? 'The middleware confirmed a valid proof for this context.' : 'This chat remains unavailable until the middleware confirms a proof.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {unlocked ? <p>Welcome. Your access decision is valid for this private session.</p> : <p>Verify your eligibility above to unlock the conversation.</p>}
        </CardContent>
      </Card>
    </AnimatedGroup>
  );
}
