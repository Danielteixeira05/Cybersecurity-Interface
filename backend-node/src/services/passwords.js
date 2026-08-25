import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

function timingSafeBase64Equal(expected, actual) {
  const expectedBuffer = Buffer.from(expected, 'base64');
  const actualBuffer = Buffer.from(actual, 'base64');
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/** Compatível com os hashes existentes do Django e com bcrypt para contas futuras. */
export async function verifyPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('$2')) return bcrypt.compare(plainPassword, storedHash);

  const [algorithm, iterationText, salt, expectedHash] = storedHash.split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationText || !salt || !expectedHash) return false;
  const iterations = Number(iterationText);
  if (!Number.isSafeInteger(iterations) || iterations < 1) return false;
  const actualHash = crypto.pbkdf2Sync(plainPassword, salt, iterations, 32, 'sha256').toString('base64');
  return timingSafeBase64Equal(expectedHash, actualHash);
}

/** Para novas contas Node, a password nunca é persistida sem bcrypt. */
export async function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length < 12) {
    throw new Error('A password tem de ter pelo menos 12 caracteres.');
  }
  return bcrypt.hash(plainPassword, 12);
}
