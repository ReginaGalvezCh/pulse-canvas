import p5 from 'p5';
import type { SessionSnapshot } from '../shared/contracts';
import { STALE_AFTER_MS } from '../shared/contracts';
import { markInterval } from '../shared/signal';

export const palettes = [
  { name: 'Warm tide', note: 'Clay, sea glass & afternoon light', paper: '#f7f3eb', colors: ['#ce704e', '#dba56c', '#537f79', '#244c54', '#e6c5a6'] },
  { name: 'After hours', note: 'Indigo, lilac & a little rose', paper: '#eeeaf2', colors: ['#3b426b', '#8583aa', '#ba7e8e', '#d4a9a7', '#6b91aa'] },
  { name: 'Wild garden', note: 'Moss, goldenrod & soft earth', paper: '#f2f0e3', colors: ['#475d41', '#88936c', '#bd953f', '#b66c4e', '#c6b998'] },
];
export interface PaintingControls { reset(): void; exportPng(): Promise<Uint8Array>; destroy(): void }
export interface PaintingState { session: SessionSnapshot; palette: number; paused: boolean; reducedMotion: boolean }

export function createPainting(host: HTMLElement, state: () => PaintingState, onMark: (count: number) => void): PaintingControls {
  let canvas: HTMLCanvasElement;
  let marks = 0, lastMark = 0, sequence = 0, previousActive = false;
  const instance = new p5(p => {
    p.setup = () => {
      const renderer = p.createCanvas(1200, 1200);
      canvas = renderer.elt as HTMLCanvasElement;
      canvas.setAttribute('aria-label', 'Abstract painting canvas');
      canvas.setAttribute('role', 'img');
      p.pixelDensity(1); p.frameRate(30); p.background(palettes[state().palette].paper);
      p.noFill();
    };
    p.draw = () => {
      const current = state();
      const signal = current.session.signal;
      const now = Date.now();
      const active = !current.paused && current.session.phase === 'painting' && signal &&
        signal.sessionId === current.session.sessionId && signal.source === current.session.source && now >= signal.receivedAt && now - signal.receivedAt < STALE_AFTER_MS;
      if (!active) { previousActive = false; return; }
      // Resume from now; never replay marks that would have occurred during a signal gap.
      if (!previousActive) lastMark = now;
      previousActive = true;
      const interval = current.reducedMotion ? Math.max(3000, markInterval(signal.bpm)) : markInterval(signal.bpm);
      if (now - lastMark < interval) return;
      lastMark = now;
      const palette = palettes[current.palette];
      const phase = sequence++ * 0.047;
      const angle = phase * 2.6;
      const radius = 210 + 100 * Math.sin(phase * 0.73);
      for (let strand = 0; strand < 16; strand++) {
        const color = p.color(palette.colors[(Math.floor(sequence / 7) + Math.floor(strand / 5)) % palette.colors.length]);
        color.setAlpha(38 + strand * 2);
        p.stroke(color); p.strokeWeight(0.65 + strand * 0.14);
        p.beginShape();
        for (let step = 0; step <= 90; step++) {
          const t = step / 90;
          const a = angle + t * 2.75;
          const wave = Math.sin(t * Math.PI) * (65 + 45 * Math.cos(phase * 0.6));
          const r = radius + strand * 3 + wave;
          const x = 600 + Math.cos(a) * r + Math.sin(t * 6 + phase) * 85;
          const y = 600 + Math.sin(a) * r * 0.92 + Math.cos(t * 5 + phase * 0.7) * 80;
          p.vertex(x, y);
        }
        p.endShape();
      }
      // Reduced motion uses the same accumulated still image: no travelling particles or camera feed.
      marks++; onMark(marks);
    };
  }, host);
  return {
    reset() { marks = 0; sequence = 0; previousActive = false; instance.background(palettes[state().palette].paper); onMark(0); },
    exportPng() { return new Promise((resolve, reject) => canvas.toBlob(async blob => {
      if (!blob) return reject(new Error('The painting could not be exported.'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/png')); },
    destroy() { instance.remove(); },
  };
}
