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

const corsOrigin = optional('CORS_ORIGIN') ?? 'http://localhost:8443';
const socketCorsOrigins = optional('SOCKET_CORS_ORIGINS') ?? corsOrigin;

export const env = Object.freeze({
  nodeEnv: optional('NODE_ENV') ?? 'development',
  port: Number(optional('PORT') ?? 3001),
  databaseUrl: optional('DATABASE_URL'),
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
