import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";
const migrationOptions = {
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...migrationOptions,
      dbClient,
      dryRun: true,
    });

    return pendingMigrations;
  } finally {
    dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrationRunner({
      ...migrationOptions,
      dbClient,
    });

    return migratedMigrations;
  } finally {
    dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
