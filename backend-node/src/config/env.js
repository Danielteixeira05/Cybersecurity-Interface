import 'dotenv/config';

const optional = (name) => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

export const env = Object.freeze({
  nodeEnv: optional('NODE_ENV') ?? 'development',
  port: Number(optional('PORT') ?? 3001),
  databaseUrl: optional('DATABASE_URL'),
  jwtSecret: optional('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN') ?? '8h',
  corsOrigin: optional('CORS_ORIGIN') ?? 'http://localhost:8443',
});

export function missingDatabaseMessage() {
  return 'DATABASE_URL não configurada. Utilize uma base ou branch PostgreSQL de testes isolada.';
}
