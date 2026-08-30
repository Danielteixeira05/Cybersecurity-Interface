import { Sequelize } from 'sequelize';
import pg from 'pg';
import { env, missingDatabaseMessage } from './env.js';

let sequelize;

// A importação estática assegura que o trace da Vercel inclui pg, que o
// Sequelize carrega dinamicamente por defeito.
export const postgresDialectModule = pg;

export function createSequelizeOptions(nodeEnv = env.nodeEnv) {
  return {
    dialect: 'postgres',
    dialectModule: postgresDialectModule,
    logging: false,
    dialectOptions: nodeEnv === 'production' ? { ssl: { require: true, rejectUnauthorized: true } } : undefined,
    pool: { max: 5, min: 0, idle: 10000 },
  };
}

export function getSequelize() {
  if (!env.databaseUrl) {
    const error = new Error(missingDatabaseMessage());
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }

  if (!sequelize) {
    sequelize = new Sequelize(env.databaseUrl, createSequelizeOptions());
  }

  return sequelize;
}

export async function verifyDatabaseConnection() {
  const connection = getSequelize();
  await connection.authenticate();
  return connection;
}

// Deliberadamente não existe sequelize.sync() neste projeto: o esquema é gerido pelos scripts SQL existentes.
