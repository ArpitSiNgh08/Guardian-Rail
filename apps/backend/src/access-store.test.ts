import assert from 'node:assert/strict';
import test from 'node:test';
import { AccessStore } from './access-store.js';

test('creates locked sessions with distinct contexts', () => {
  const store = new AccessStore();
  const first = store.createSession();
  const second = store.createSession();

  assert.equal(first.status, 'locked');
  assert.equal(second.status, 'locked');
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.contextId, second.contextId);
});

test('unlocks a session once and rejects a replayed nullifier', () => {
  const store = new AccessStore();
  const session = store.createSession();
  const nullifier = 'a'.repeat(64);

  const unlocked = store.unlock(session.id, nullifier);
  assert.notEqual(unlocked, 'missing');
  assert.notEqual(unlocked, 'replayed');
  if (unlocked === 'missing' || unlocked === 'replayed') return;
  assert.equal(unlocked.status, 'unlocked');
  assert.equal(unlocked.nullifier, nullifier);

  assert.equal(store.unlock(session.id, nullifier), 'replayed');
});

test('does not let a nullifier be reused across sessions', () => {
  const store = new AccessStore();
  const first = store.createSession();
  const second = store.createSession();
  const nullifier = 'b'.repeat(64);

  assert.notEqual(store.unlock(first.id, nullifier), 'missing');
  assert.equal(store.unlock(second.id, nullifier), 'replayed');
});

test('allows distinct nullifiers for distinct sessions', () => {
  const store = new AccessStore();
  const first = store.createSession();
  const second = store.createSession();

  const firstResult = store.unlock(first.id, 'c'.repeat(64));
  const secondResult = store.unlock(second.id, 'd'.repeat(64));

  assert.notEqual(firstResult, 'missing');
  assert.notEqual(firstResult, 'replayed');
  assert.notEqual(secondResult, 'missing');
  assert.notEqual(secondResult, 'replayed');
});

test('returns missing for an unknown session', () => {
  const store = new AccessStore();

  assert.equal(store.unlock('unknown-session', 'e'.repeat(64)), 'missing');
});
