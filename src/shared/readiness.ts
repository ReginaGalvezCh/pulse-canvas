export function readinessMessage(verdict: string, reason: string, secret?: string): string {
  let safe = typeof reason === 'string' ? reason : '';
  if (secret) safe = safe.split(secret).join('[redacted]');
  safe = safe.replace(/https?:\/\/\S+/g, '[link]').replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[redacted]').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 280).trim();
  return `Device check (${verdict}): ${safe || 'No explanation was supplied. Please review camera access and Presage configuration.'}`;
}
