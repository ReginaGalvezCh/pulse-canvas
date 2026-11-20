import { describe, expect, it } from 'vitest';
import { validatePng } from '../src/main/export';
import { MAX_EXPORT_BYTES } from '../src/shared/contracts';

describe('export boundary', () => {
  it('rejects arbitrary data and oversized payloads before decoding', () => {
    expect(() => validatePng('file:///private')).toThrow();
    expect(() => validatePng(new Uint8Array(MAX_EXPORT_BYTES + 1))).toThrow();
    expect(() => validatePng(new Uint8Array(40))).toThrow();
  });
  it('bounds PNG dimensions before native decoding', () => {
    const png = Buffer.alloc(33);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
    png.write('IHDR', 12); png.writeUInt32BE(1200, 16); png.writeUInt32BE(1200, 20);
    expect(validatePng(png)).toEqual(png);
    png.writeUInt32BE(100000, 16);
    expect(() => validatePng(png)).toThrow('dimensions');
  });
});
