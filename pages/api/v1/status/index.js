import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

export default async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const databaseVersionResult = await database.query("SHOW server_version");
    const databaseVersion = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnections = parseInt(
      databaseMaxConnectionsResult.rows[0].max_connections,
    );

    const databaseUserOpenedConnectionsResult = await database.query({
      text: "SELECT count(*)::int AS opened_connections FROM pg_stat_activity WHERE datname = $1;",
      values: [process.env.POSTGRES_DB],
    });
    const databaseUserOpenedConnections =
      databaseUserOpenedConnectionsResult.rows[0].opened_connections;

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          max_connections: databaseMaxConnections,
          opened_connections: databaseUserOpenedConnections,
          version: databaseVersion,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });
    console.log("\nErro dentro do catch do controller");
    console.error(publicErrorObject);

    response.status(500).json(publicErrorObject);
  }
}
