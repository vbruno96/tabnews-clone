import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userIputValues) {
  await validateUniqueUsername(userIputValues.username);
  await validateUniqueEmail(userIputValues.email);
  await hashPasswordInObject(userIputValues);

  const newUser = await runInsertQuery(userIputValues);
  return newUser;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
    SELECT
      email
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
    SELECT
      username
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para realizar o cadastro.",
      });
    }
  }

  async function hashPasswordInObject(userIputValues) {
    const hashedPassword = await password.hash(userIputValues.password);
    userIputValues.password = hashedPassword;
  }

  async function runInsertQuery({ username, email, password }) {
    const results = await database.query({
      text: `
    INSERT INTO
      users (username, email, password)
    VALUES
        ($1, $2, $3)
    RETURNING
      *
    ;`,
      values: [username, email, password],
    });

    return results.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
    SELECT
      *
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    LIMIT
      1
    ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
