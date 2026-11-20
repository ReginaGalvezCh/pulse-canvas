import { randomUUID } from 'node:crypto';
import type { SmartSpectraSDK as SdkInstance } from '@smartspectra/node-sdk';
import { Capabilities, initialSnapshot, MAX_LIVE_SESSION_MS, SessionSnapshot, StartRequest } from '../shared/contracts';
import { SignalGate } from '../shared/signal';
import { readinessMessage } from '../shared/readiness';

type SdkModule = typeof import('@smartspectra/node-sdk');
const errors: Record<number, string> = {
  2: 'Presage could not authenticate. Check your local API key.',
  3: 'The SDK configuration is not supported.', 4: 'Your Presage trial allowance has been reached.',
  5: 'Presage authentication needs a network connection.', 6: 'Presage is temporarily unavailable.',
  7: 'The camera is unavailable. Check permission and close other camera apps.',
  13: 'Pulse measurement is not enabled for this Presage key.',
  14: 'The camera frame rate is too low. Close other apps and start a new session.',
};
const hints: Record<number, string> = {
  1: 'Keep your face in view.', 2: 'One person at a time, please.', 3: 'Move into the centre of the camera view.',
  4: 'Adjust your distance from the camera.', 5: 'A little more light will help.', 6: 'Try softer, more even light.',
  7: 'Keep your upper body visible.', 10: 'The camera is adjusting. One moment.', 11: 'The camera needs a steadier frame rate.',
  12: 'Settle into a comfortable, still position.', 13: 'Move a little farther from the camera.', 14: 'Move a little closer to the camera.',
  15: 'Move your face a little lower.', 16: 'Move your face a little higher.', 17: 'Face the camera directly.',
};

export class SessionService {
  private current = { ...initialSnapshot };
  private sdk: SdkInstance | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private gate: SignalGate | null = null;
  private generation = 0;
  private starting: Promise<SessionSnapshot> | null = null;
  private stopping: Promise<void> | null = null;
  constructor(private readonly emit: (state: SessionSnapshot) => void, private apiKey?: string,
    private readonly loadSdk: () => SdkModule = () => require('@smartspectra/node-sdk')) {}
  configureAccess(apiKey: string): { configured: boolean } {
    if (this.starting || this.stopping || !['idle', 'stopped', 'error'].includes(this.current.phase)) throw new Error('Stop the session before changing access.');
    this.apiKey = apiKey;
    return { configured: !!this.apiKey };
  }
  snapshot(): SessionSnapshot { return { ...this.current }; }
  private update(patch: Partial<SessionSnapshot>): void { this.current = { ...this.current, ...patch }; this.emit(this.snapshot()); }
  capabilities(): Capabilities {
    const base: Capabilities = { hasApiKey: !!this.apiKey, platform: process.platform + '-' + process.arch, sdkVersion: null, cameras: [], cameraError: null };
    try {
      const module = this.loadSdk();
      base.sdkVersion = module.SmartSpectraSDK.version;
      base.cameras = module.SmartSpectraSDK.availableCameras().map(camera => ({ id: camera.id, name: camera.name || 'Camera' }));
    } catch { base.cameraError = 'The native camera module could not load. Simulation is still available.'; }
    return base;
  }
  start(request: StartRequest): Promise<SessionSnapshot> {
    if (this.starting || this.stopping || !['idle', 'stopped', 'error'].includes(this.current.phase)) return Promise.resolve(this.snapshot());
    if (!request.consent) return Promise.reject(new Error('Consent is required.'));
    const operation = this.startInternal(request);
    this.starting = operation;
    void operation.finally(() => { if (this.starting === operation) this.starting = null; }).catch(() => {});
    return operation;
  }
  private async startInternal(request: StartRequest): Promise<SessionSnapshot> {
    const generation = ++this.generation;
    await this.cleanup();
    if (generation !== this.generation) return this.snapshot();
    const sessionId = randomUUID();
    this.gate = new SignalGate(sessionId, request.source);
    this.update({ sessionId, source: request.source, signal: null, phase: 'checking', message: 'Preparing your canvas…' });
    if (request.source === 'simulation') {
      const began = Date.now();
      this.update({ phase: 'acquiring', message: 'Simulation uses generated values. No camera is active.' });
      this.timer = setInterval(() => {
        const now = Date.now();
        const sample = this.gate?.accept({ value: 70 + 8 * Math.sin((now - began) / 9000), confidence: 100, stable: true }, now * 1000, now);
        if (sample) this.update({ phase: 'painting', signal: sample, message: 'Generated rhythm. Your camera stays off.' });
      }, 300);
      return this.snapshot();
    }
    try {
      if (!this.apiKey) throw Object.assign(new Error(), { code: 2 });
      const module = this.loadSdk();
      const sdk = new module.SmartSpectraSDK({ apiKey: this.apiKey, requestedMetrics: [module.MetricType.PULSE_RATE], enableTelemetry: false, enableAccumulatedOutput: false, logLevel: module.SmartSpectraLogLevel.kNone });
      this.sdk = sdk;
      let valid = true;
      sdk.on('validationStatus', code => {
        if (generation !== this.generation) return;
        valid = code === module.ValidationCode.kOk;
        if (!valid) { this.gate?.invalidate(); this.update({ phase: 'signalLost', signal: null, message: hints[code] || 'Waiting for a usable signal.' }); }
      });
      sdk.on('metrics', (buffer, eventTimestamp) => {
        if (generation !== this.generation || !valid) return;
        let metrics: { cardio?: { pulseRate?: { value?: number | null; stable?: boolean | null; confidence?: number | null; timestamp?: unknown }[] } };
        try { metrics = module.decodeMetrics(buffer) as typeof metrics; }
        catch { this.gate?.invalidate(); this.update({ phase: 'signalLost', signal: null, message: 'The signal could not be read. Painting is paused.' }); return; }
        const last = metrics.cardio?.pulseRate?.at(-1);
        if (!last) return;
        const timestamp = last.timestamp == null ? eventTimestamp : Number(last.timestamp);
        const signal = this.gate?.accept(last, timestamp, Date.now());
        if (signal) this.update({ phase: 'painting', signal, message: 'Your estimated pulse is shaping the painting.' });
        else if (!this.gate?.latest(Date.now())) this.update({ phase: 'signalLost', signal: null, message: 'Waiting for a stable pulse estimate.' });
      });
      sdk.on('error', code => {
        if (generation !== this.generation) return;
        ++this.generation;
        this.update({ phase: 'error', signal: null, message: errors[code] || 'The session stopped. Please start again.' });
        void this.cleanup().catch(() => {});
      });
      sdk.useCamera(request.cameraId ? module.CameraSelection.byId(request.cameraId) : module.CameraSelection.default);
      this.update({ message: 'Checking camera and device readiness…' });
      const readiness = await sdk.checkDeviceReadiness();
      if (generation !== this.generation) return this.snapshot();
      if (readiness.verdict !== 'ready') {
        this.update({ phase: 'error', signal: null, message: readinessMessage(readiness.verdict, readiness.reason, this.apiKey) });
        await this.cleanup();
        return this.snapshot();
      }
      sdk.start();
      if (generation !== this.generation) return this.snapshot();
      const began = Date.now();
      this.update({ phase: 'acquiring', message: 'Camera active. Stay comfortably still while the signal settles.' });
      this.timer = setInterval(() => {
        if (generation !== this.generation) return;
        if (Date.now() - began >= MAX_LIVE_SESSION_MS) {
          void this.stop().then(() => this.update({ message: 'Two-minute limit reached. The camera is off to preserve your free credits.' })).catch(() => {});
          return;
        }
        if (this.current.signal && !this.gate?.latest(Date.now())) this.update({ phase: 'signalLost', signal: null, message: 'The signal is no longer fresh. Painting is paused.' });
      }, 250);
    } catch (error) {
      if (generation === this.generation) {
        ++this.generation;
        const code = typeof error === 'object' && error && 'code' in error ? Number(error.code) : -1;
        this.update({ phase: 'error', signal: null, message: errors[code] || 'The native SDK could not start. Check the setup guide and try again.' });
        await this.cleanup();
      }
    }
    return this.snapshot();
  }
  async stop(): Promise<SessionSnapshot> {
    ++this.generation;
    this.update({ phase: 'stopping', signal: null, message: 'Releasing the session…' });
    await this.starting?.catch(() => {});
    await this.cleanup();
    this.update({ phase: 'stopped', signal: null, message: 'Session stopped. Your painting is yours to keep.' });
    return this.snapshot();
  }
  private cleanup(): Promise<void> {
    if (this.stopping) return this.stopping;
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.gate?.invalidate();
    const sdk = this.sdk; this.sdk = null;
    if (!sdk) return Promise.resolve();
    const operation = (async () => { try { await sdk.stopAsync(); } finally { await sdk.destroy(); } })();
    this.stopping = operation;
    void operation.finally(() => { if (this.stopping === operation) this.stopping = null; }).catch(() => {});
    return operation;
  }
}
