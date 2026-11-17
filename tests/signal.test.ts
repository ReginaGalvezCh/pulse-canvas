import { describe, expect, it } from 'vitest';
import { SignalGate, markInterval } from '../src/shared/signal';
import { STALE_AFTER_MS, startSchema } from '../src/shared/contracts';

const reliable = { value: 72, stable: true, confidence: 80 };
describe('signal validity and freshness', () => {
  it('accepts only explicitly stable pulse estimates with confidence on the SDK percentage scale', () => {
    const gate = new SignalGate('session-a', 'live');
    expect(gate.accept(reliable, 100, 1000)?.source).toBe('live');
    expect(gate.accept({ ...reliable, stable: false }, 101, 1010)).toBeNull();
    expect(gate.latest(1010)).toBeNull();
    expect(gate.accept({ ...reliable, confidence: 0.9 }, 102, 1020)).toBeNull();
    expect(gate.accept({ ...reliable, confidence: 40 }, 103, 1030)).not.toBeNull();
    expect(gate.accept({ ...reliable, value: NaN }, 104, 1040)).toBeNull();
    expect(gate.accept({ ...reliable, value: 111 }, 105, 1050)).toBeNull();
  });
  it('does not refresh old or out-of-order samples', () => {
    const gate = new SignalGate('a', 'simulation');
    gate.accept(reliable, 200, 1000);
    expect(gate.accept(reliable, 200, 5900)).toBeNull();
    expect(gate.accept(reliable, 199, 5900)).toBeNull();
    expect(gate.latest(1000 + STALE_AFTER_MS - 1)).not.toBeNull();
    expect(gate.latest(1000 + STALE_AFTER_MS)).toBeNull();
    expect(gate.latest(999)).toBeNull();
  });
  it('forgets an invalidated signal and preserves source/session separation', () => {
    const gate = new SignalGate('live-session', 'live');
    expect(gate.accept(reliable, 10, 100)?.sessionId).toBe('live-session');
    gate.invalidate();
    expect(gate.latest(101)).toBeNull();
  });
  it('bounds artistic cadence without treating it as a clinical range', () => {
    expect(markInterval(60)).toBe(1000);
    expect(markInterval(1000)).toBe(400);
    expect(markInterval(1)).toBe(1500);
    expect(markInterval(NaN)).toBe(Infinity);
  });
  it('requires explicit consent and rejects unknown IPC fields', () => {
    expect(startSchema.safeParse({ source: 'live', consent: false }).success).toBe(false);
    expect(startSchema.safeParse({ source: 'live', consent: true, command: 'shell' }).success).toBe(false);
  });
});
