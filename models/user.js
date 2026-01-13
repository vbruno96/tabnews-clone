import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userIputValues) {
  await validateUniqueUsername(userIputValues.username);
  await validateUniqueEmail(userIputValues.email);
  await hashPasswordInObject(userIputValues);

  const newUser = await runInsertQuery(userIputValues);
  return newUser;

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

async function update(username, userIputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userIputValues) {
    await validateUniqueUsername(userIputValues.username);
  }

  if ("email" in userIputValues) {
    await validateUniqueEmail(userIputValues.email);
  }

  if ("password" in userIputValues) {
    await hashPasswordInObject(userIputValues);
  }

  const userWithNewValues = {
    ...currentUser,
    ...userIputValues,
  };

  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return result.rows[0];
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

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const result = await database.query({
      text: `
    SELECT
      *
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    LIMIT
      1
    ;`,
      values: [email],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O email informado não foi encontrado no sistema.",
        action: "Verifique se o email está digitado corretamente.",
      });
    }

    return result.rows[0];
  }
}

async function findOneById(id) {
  const userFound = await runSelectQuery(id);

  return userFound;

  async function runSelectQuery(id) {
    const result = await database.query({
      text: `
    SELECT
      *
    FROM
      users
    WHERE
      id = $1
    LIMIT
      1
    ;`,
      values: [id],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
      });
    }

    return result.rows[0];
  }
}

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
      action: "Utilize outro email para realizar esta operação.",
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
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function hashPasswordInObject(userIputValues) {
  const hashedPassword = await password.hash(userIputValues.password);
  userIputValues.password = hashedPassword;
}

const user = {
  create,
  update,
  findOneByUsername,
  findOneByEmail,
  findOneById,
};

export default user;
