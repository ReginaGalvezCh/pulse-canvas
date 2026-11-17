import { MAX_EXPORT_BYTES } from '../shared/contracts';

export function validatePng(input: unknown): Buffer {
  if (!(input instanceof Uint8Array) || input.byteLength > MAX_EXPORT_BYTES || input.byteLength < 33) throw new Error('Invalid artwork.');
  const buffer = Buffer.from(input);
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Only PNG artwork is supported.');
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
  if (!width || !height || width > 6000 || height > 6000) throw new Error('Artwork dimensions are too large.');
  return buffer;
}
