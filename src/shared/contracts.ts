import { z } from 'zod';

export const sourceSchema = z.enum(['live', 'simulation']);
export type Source = z.infer<typeof sourceSchema>;
export const startSchema = z.object({ source: sourceSchema, consent: z.literal(true), cameraId: z.string().max(512).optional() }).strict();
export type StartRequest = z.infer<typeof startSchema>;
export const signalSchema = z.object({
  sessionId: z.string(), source: sourceSchema, bpm: z.number().finite().positive(),
  confidence: z.number().min(0).max(100), timestampUs: z.number().finite().nonnegative(),
  receivedAt: z.number().finite(),
});
export type Signal = z.infer<typeof signalSchema>;
export type Phase = 'idle' | 'checking' | 'acquiring' | 'painting' | 'signalLost' | 'stopping' | 'stopped' | 'error';
export interface SessionSnapshot {
  phase: Phase; source: Source; sessionId: string; message: string; signal: Signal | null;
}
export const initialSnapshot: SessionSnapshot = { phase: 'idle', source: 'simulation', sessionId: '', message: 'A little time. A different kind of canvas.', signal: null };
export interface Camera { id: string; name: string }
export interface Capabilities { hasApiKey: boolean; platform: string; sdkVersion: string | null; cameras: Camera[]; cameraError: string | null }
export interface PulseBridge {
  configureAccess(apiKey: string): Promise<{ configured: boolean }>;
  capabilities(): Promise<Capabilities>;
  start(request: StartRequest): Promise<SessionSnapshot>;
  stop(): Promise<SessionSnapshot>;
  snapshot(): Promise<SessionSnapshot>;
  saveArtwork(bytes: Uint8Array): Promise<{ saved: boolean }>;
  onSession(callback: (snapshot: SessionSnapshot) => void): () => void;
}
declare global { interface Window { pulse: PulseBridge } }

// A conservative prototype timeout, pending live cadence validation. Not a medical threshold.
export const STALE_AFTER_MS = 5000;
export const MAX_EXPORT_BYTES = 20 * 1024 * 1024;
export const MAX_LIVE_SESSION_MS = 120_000;
