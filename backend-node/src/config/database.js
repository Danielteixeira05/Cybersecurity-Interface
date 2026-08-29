import { Sequelize } from 'sequelize';
import { env, missingDatabaseMessage } from './env.js';

let sequelize;

export function getSequelize() {
  if (!env.databaseUrl) {
    const error = new Error(missingDatabaseMessage());
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }

  if (!sequelize) {
    sequelize = new Sequelize(env.databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: env.nodeEnv === 'production' ? { ssl: { require: true, rejectUnauthorized: true } } : undefined,
      pool: { max: 5, min: 0, idle: 10000 },
    });
  }

  return sequelize;
}

export async function verifyDatabaseConnection() {
  const connection = getSequelize();
  await connection.authenticate();
  return connection;
}

// Deliberadamente não existe sequelize.sync() neste projeto: o esquema é gerido pelos scripts SQL existentes.
