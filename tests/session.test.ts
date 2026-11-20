import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '../src/main/session';
import { MAX_LIVE_SESSION_MS, SessionSnapshot } from '../src/shared/contracts';

afterEach(() => vi.useRealTimers());
describe('session lifecycle without a camera', () => {
  it('produces labelled synthetic values and releases its timer on stop', async () => {
    vi.useFakeTimers();
    const events: SessionSnapshot[] = [];
    const service = new SessionService(state => events.push(state));
    await service.start({ source: 'simulation', consent: true });
    await vi.advanceTimersByTimeAsync(600);
    expect(service.snapshot().phase).toBe('painting');
    expect(service.snapshot().signal?.source).toBe('simulation');
    await service.stop();
    const count = events.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(events).toHaveLength(count);
    expect(service.snapshot().signal).toBeNull();
  });
  it('handles stop while start is pending without resurrecting a session', async () => {
    const service = new SessionService(() => {});
    const start = service.start({ source: 'simulation', consent: true });
    const stop = service.stop();
    await Promise.all([start, stop]);
    expect(service.snapshot().phase).toBe('stopped');
    expect(service.snapshot().signal).toBeNull();
  });
  it('does not silently replace a live session with simulation when credentials are missing', async () => {
    const service = new SessionService(() => {});
    await service.start({ source: 'live', consent: true });
    expect(service.snapshot().phase).toBe('error');
    expect(service.snapshot().source).toBe('live');
    expect(service.snapshot().signal).toBeNull();
    expect(service.snapshot().message).toContain('API key');
  });
  it('stops a live session at the free-credit time limit without restarting', async () => {
    vi.useFakeTimers();
    const fake = mockSdk('ready');
    const service = new SessionService(() => {}, 'test-key-not-a-real-credential', fake.load);
    await service.start({ source: 'live', consent: true });
    expect(fake.sdk.start).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(MAX_LIVE_SESSION_MS);
    expect(service.snapshot().phase).toBe('stopped');
    expect(fake.sdk.destroy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(MAX_LIVE_SESSION_MS);
    expect(fake.sdk.start).toHaveBeenCalledTimes(1);
    expect(service.snapshot().message).toContain('free credits');
  });
  it('blocks limited readiness and tears down the SDK instead of starting capture', async () => {
    const fake = mockSdk('limited');
    const service = new SessionService(() => {}, 'test-key-not-a-real-credential', fake.load);
    await service.start({ source: 'live', consent: true });
    expect(service.snapshot().phase).toBe('error');
    expect(fake.sdk.start).not.toHaveBeenCalled();
    expect(fake.sdk.destroy).toHaveBeenCalledTimes(1);
  });
  it('requests the reference traces needed by readiness while retaining pulse rate for painting', async () => {
    const fake = mockSdk('limited');
    const service = new SessionService(() => {}, 'test-key-not-a-real-credential', fake.load);
    await service.start({ source: 'live', consent: true });
    const options = fake.construct.mock.calls[0][0];
    // SDK 3.5 native breathing_pulse policy requires CHEST_BREATHING (0) and ARTERIAL_PRESSURE_TRACE (16).
    expect(options.requestedMetrics).toEqual(expect.arrayContaining([0, 16]));
    expect(options.requestedMetrics).toContain(15);
    expect(options.requestedMetrics).toHaveLength(3);
    expect(options.enableTelemetry).toBe(false);
  });
  it('counts preparation time against the live budget', async () => {
    vi.useFakeTimers();
    const fake = mockSdk('ready');
    fake.sdk.checkDeviceReadiness.mockImplementation(async () => { vi.setSystemTime(Date.now() + MAX_LIVE_SESSION_MS); return { verdict: 'ready', reason: 'Synthetic test result' }; });
    const service = new SessionService(() => {}, 'test-key-not-a-real-credential', fake.load);
    await service.start({ source: 'live', consent: true });
    expect(fake.sdk.start).not.toHaveBeenCalled();
    expect(fake.sdk.destroy).toHaveBeenCalledTimes(1);
    expect(service.snapshot().phase).toBe('stopped');
  });
  it('never accepts a configuration change during a running session', async () => {
    const service = new SessionService(() => {});
    await service.start({ source: 'simulation', consent: true });
    expect(() => service.configureAccess('another-test-key')).toThrow('Stop');
    await service.stop();
    expect(service.configureAccess('another-test-key').configured).toBe(true);
  });
});

function mockSdk(verdict: 'ready' | 'limited') {
  const sdk = {
    on: vi.fn(), useCamera: vi.fn(), start: vi.fn(),
    stopAsync: vi.fn().mockResolvedValue(undefined), destroy: vi.fn().mockResolvedValue(undefined),
    checkDeviceReadiness: vi.fn().mockResolvedValue({ verdict, reason: 'Synthetic test result' }),
  };
  const construct = vi.fn((_options: { requestedMetrics: number[]; enableTelemetry: boolean }) => {});
  const module = {
    SmartSpectraSDK: class { constructor(options: { requestedMetrics: number[]; enableTelemetry: boolean }) { construct(options); return sdk; } },
    CameraSelection: { default: { kind: 'default' }, byId: (id: string) => ({ kind: 'byId', id }) },
    MetricType: { CHEST_BREATHING: 0, PULSE_RATE: 15, ARTERIAL_PRESSURE_TRACE: 16 }, SmartSpectraLogLevel: { kNone: 4 }, ValidationCode: { kOk: 0 },
  };
  return { sdk, construct, load: () => module as unknown as typeof import('@smartspectra/node-sdk') };
}
