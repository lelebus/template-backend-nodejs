require("array-foreach-async");
import { genSaltSync, hashSync } from "bcryptjs";

import db from "../data-access";
import logger from "../utils/logger";

async function cleanDb() {
  try {
    await db.connection.query("DELETE FROM users");
  } catch (e) {
    logger.error(e);
  }
}

async function insertUsers() {
  const users = require("./mocks/users").getUsers();
  const { RESET_TOKEN } = require("./mocks/users");
  await users.forEachAsync(async (user) => {
    const query = `INSERT INTO users (id, role, locale, email, password, image_url, profile, reset_count, reset_token, reset_token_expiration, created_on, last_update) VALUES (
      '${user.id}',
      ${user.role ? "'" + user.role + "'" : null},
      '${user.locale}',
      '${user.email}',
      '${hashSync(user.password, genSaltSync(10))}',
      '${user.image_url}',
      '${JSON.stringify(user.profile)}',
      ${user.reset_count},
      '${RESET_TOKEN.reset_token}',
      '${RESET_TOKEN.reset_token_expiration}',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`;
    await db.connection.query(query).catch((e) => {
      logger.error(e);
      throw e;
    });
  });
}

export { cleanDb, insertUsers };
