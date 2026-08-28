import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

const PASSWORD_SETS = Object.freeze([
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '23456789',
  '!@#$%^&*_-+=',
]);

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

/**
 * Gera uma password temporária apenas em memória para a resposta de criação.
 * Cada conjunto obrigatório contribui com pelo menos um carácter e a seleção
 * usa exclusivamente primitivas criptograficamente seguras do Node.
 */
export function generateTemporaryPassword(length = 16) {
  if (!Number.isSafeInteger(length) || length < 12) {
    throw new Error('O tamanho da password temporária tem de ser pelo menos 12 caracteres.');
  }

  const alphabet = PASSWORD_SETS.join('');
  const characters = PASSWORD_SETS.map((set) => set[crypto.randomInt(set.length)]);
  while (characters.length < length) {
    characters.push(alphabet[crypto.randomInt(alphabet.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join('');
}
