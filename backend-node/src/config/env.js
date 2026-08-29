import 'dotenv/config';

const optional = (name) => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

function positiveInteger(name, fallback) {
  const value = optional(name);
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) throw new Error(`${name} tem de ser um inteiro entre 1 e 100.`);
  return parsed;
}

function boolean(name, fallback = false) {
  const value = optional(name);
  if (value === undefined) return fallback;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  throw new Error(`${name} tem de ser true ou false.`);
}

const nodeEnv = optional('NODE_ENV') ?? 'development';

function configuredOrigins(name, fallback) {
  const raw = optional(name) ?? fallback;
  const origins = raw.split(',').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    let parsed;
    try {
      parsed = new URL(entry);
    } catch {
      throw new Error(`${name} contém uma origem inválida.`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error(`${name} contém uma origem inválida.`);
    }
    return parsed.origin;
  });
  if (!origins.length) throw new Error(`${name} deve conter pelo menos uma origem explícita.`);
  return origins.join(',');
}

const corsOrigin = configuredOrigins('CORS_ORIGIN', 'http://localhost:8443');
const socketCorsOrigins = configuredOrigins('SOCKET_CORS_ORIGINS', corsOrigin);

function productionDatabaseUrl(value) {
  if (!value || nodeEnv !== 'production') return value;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL de produção inválida.');
  }
  if (!parsed.hostname.endsWith('.neon.tech') || !parsed.hostname.includes('-pooler.')) {
    throw new Error('DATABASE_URL de produção deve usar o pooler Neon.');
  }
  parsed.searchParams.set('sslmode', 'verify-full');
  return parsed.toString();
}

export const env = Object.freeze({
  nodeEnv,
  port: Number(optional('PORT') ?? 3001),
  databaseUrl: productionDatabaseUrl(optional('DATABASE_URL')),
  jwtSecret: optional('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN') ?? '8h',
  corsOrigin,
  socketCorsOrigins,
  readOnlyMode: boolean('READ_ONLY_MODE', false),
  maxUploadMb: positiveInteger('MAX_UPLOAD_MB', 10),
  documentUploadSafetyMaxMb: positiveInteger('DOCUMENT_UPLOAD_SAFETY_MAX_MB', 50),
});

export function missingDatabaseMessage() {
  return 'DATABASE_URL não configurada. Utilize uma base ou branch PostgreSQL de testes isolada.';
}
