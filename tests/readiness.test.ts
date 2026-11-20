import { expect, it } from 'vitest';
import { readinessMessage } from '../src/shared/readiness';
it('retains an actionable provider explanation without exposing a configured secret', () => {
  expect(readinessMessage('blocked', 'Camera permission is required.')).toContain('Camera permission is required.');
  expect(readinessMessage('inconclusive', 'Failure with synthetic-test-key', 'synthetic-test-key')).not.toContain('synthetic-test-key');
  expect(readinessMessage('blocked', 'See https://example.com/token?key=abc')).not.toContain('key=');
});
it('bounds and cleans provider text', () => {
  expect(readinessMessage('blocked', 'a\nb')).not.toContain('\n');
  expect(readinessMessage('blocked', 'x '.repeat(1000)).length).toBeLessThan(310);
});
