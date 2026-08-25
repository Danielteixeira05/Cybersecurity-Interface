import 'dotenv/config';

const optional = (name) => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

function boolean(name, fallback = false) {
  const value = optional(name);
  if (value === undefined) return fallback;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  throw new Error(`${name} tem de ser true ou false.`);
}

export const env = Object.freeze({
  nodeEnv: optional('NODE_ENV') ?? 'development',
  port: Number(optional('PORT') ?? 3001),
  databaseUrl: optional('DATABASE_URL'),
  jwtSecret: optional('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN') ?? '8h',
  corsOrigin: optional('CORS_ORIGIN') ?? 'http://localhost:8443',
  readOnlyMode: boolean('READ_ONLY_MODE', false),
});

export function missingDatabaseMessage() {
  return 'DATABASE_URL não configurada. Utilize uma base ou branch PostgreSQL de testes isolada.';
}
