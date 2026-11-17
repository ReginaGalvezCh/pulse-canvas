import { z } from 'zod';
import { Signal, Source, STALE_AFTER_MS } from './contracts';

const measurementSchema = z.object({
  // SmartSpectra 3.5 model card's documented operating range for pulse rate.
  value: z.number().finite().min(40).max(110), stable: z.literal(true),
  confidence: z.number().finite().min(40).max(100),
});

export class SignalGate {
  private lastTimestamp = -1;
  private current: Signal | null = null;
  constructor(private readonly sessionId: string, private readonly source: Source) {}
  accept(raw: unknown, timestampUs: number, now: number): Signal | null {
    const parsed = measurementSchema.safeParse(raw);
    if (!parsed.success || !Number.isFinite(timestampUs) || timestampUs < 0) {
      this.current = null;
      return null;
    }
    // Repeated accumulated samples must not refresh the freshness deadline.
    if (timestampUs <= this.lastTimestamp) return null;
    this.lastTimestamp = timestampUs;
    this.current = { sessionId: this.sessionId, source: this.source, bpm: parsed.data.value,
      confidence: parsed.data.confidence, timestampUs, receivedAt: now };
    return this.current;
  }
  latest(now: number): Signal | null {
    if (!this.current || now - this.current.receivedAt >= STALE_AFTER_MS || now < this.current.receivedAt) return null;
    return this.current;
  }
  invalidate(): void { this.current = null; }
}

export function markInterval(bpm: number): number {
  if (!Number.isFinite(bpm) || bpm <= 0) return Infinity;
  // This bounded cadence is artistic synthesis, not beat detection.
  return 60_000 / Math.min(150, Math.max(40, bpm));
}
