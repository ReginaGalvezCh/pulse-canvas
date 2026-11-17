// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../src/renderer/App';
import { initialSnapshot } from '../src/shared/contracts';

vi.mock('../src/renderer/painting', () => ({
  palettes: [{ name: 'Warm tide', note: 'Clay and sea glass', paper: '#fff', colors: ['#123', '#456'] }],
  createPainting: () => ({ reset: vi.fn(), destroy: vi.fn(), exportPng: vi.fn() }),
}));
beforeEach(() => {
  window.pulse = {
    configureAccess: vi.fn().mockResolvedValue({ configured: true }),
    capabilities: vi.fn().mockResolvedValue({ hasApiKey: false, platform: 'darwin-arm64', sdkVersion: '3.5.0', cameras: [], cameraError: null }),
    snapshot: vi.fn().mockResolvedValue(initialSnapshot), onSession: vi.fn().mockReturnValue(() => {}),
    start: vi.fn().mockResolvedValue({ ...initialSnapshot, phase: 'acquiring' }),
    stop: vi.fn().mockResolvedValue({ ...initialSnapshot, phase: 'stopped' }), saveArtwork: vi.fn(),
  };
});
afterEach(cleanup);
it('does not allow starting before explicit simulation acknowledgement', async () => {
  render(<App />);
  const begin = screen.getByRole('button', { name: /Begin your painting/ }) as HTMLButtonElement;
  expect(begin.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/I understand this is a simulation/));
  expect(begin.disabled).toBe(false);
  fireEvent.click(begin);
  await waitFor(() => expect(window.pulse.start).toHaveBeenCalledWith({ source: 'simulation', consent: true, cameraId: undefined }));
});
it('keeps live mode blocked when there is no local Presage key', async () => {
  render(<App />);
  await waitFor(() => expect(window.pulse.capabilities).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Live camera' }));
  fireEvent.click(screen.getByLabelText(/I agree to use my camera/));
  expect((screen.getByRole('button', { name: /Begin your painting/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText('Presage API key')).toBeTruthy();
  expect(window.pulse.start).not.toHaveBeenCalled();
});
it('passes a manually entered key through the write-only bridge and clears the field', async () => {
  render(<App />);
  await waitFor(() => expect(window.pulse.capabilities).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Live camera' }));
  const input = screen.getByLabelText('Presage API key') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'test-key-not-a-real-credential' } });
  fireEvent.click(screen.getByRole('button', { name: 'Use this key' }));
  await waitFor(() => expect(window.pulse.configureAccess).toHaveBeenCalledWith('test-key-not-a-real-credential'));
  await waitFor(() => expect(input.value).toBe(''));
  expect(window.pulse.start).not.toHaveBeenCalled();
});
