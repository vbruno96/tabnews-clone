import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
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

  const statusServerObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        max_connections: databaseMaxConnections,
        opened_connections: databaseUserOpenedConnections,
        version: databaseVersion,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusServerObject,
  );

  response.status(200).json(secureOutputValues);
}
