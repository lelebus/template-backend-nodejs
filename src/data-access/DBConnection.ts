import { environment, database } from "../config";
import logger from "../utils/logger";

import { Sequelize } from "sequelize";

// Database connection singleton
class DBConnection {
  private pool: Sequelize;

  constructor() {
    // mock database if environment is mock
    if (environment === "mock") {
      this.pool = new Sequelize("sqlite::memory:", {
        logging: false,
      });

      this.pool.truncate().then(() => {
        this.pool.sync({ force: true }).then(() => {
          logger.info(`🛢️  Database => mocked for mock environment`);
        });
      });

      return;
    }

    this.pool = new Sequelize(database.name, database.user, database.password, {
      dialect: "postgres",
      host: database.url,
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000,
      },
      benchmark: true,
      logQueryParameters: true,
      logging: (sqlQuery, duration) =>
        logger.info(
          { query: sqlQuery.split("Executed ")[1], duration: `${duration} ms` },
          "database => query"
        ),
    });
    logger.info(`🛢️  Database => started`);

    // sync pool
    this.pool.sync().then(() => {
      logger.info(`database => schema correctly set up`);
    });
  }

  public getInstance() {
    return this.pool;
  }

  public stop() {
    this.pool.close().then(() => {
      logger.info(`database => stopped`);
    });
  }

  public async test() {
    try {
      await this.pool.authenticate();
      logger.info("Connection has been established successfully.");
    } catch (error) {
      logger.error("Unable to connect to the database:", error);
    }
  }
}

// exploit nodejs module caching system to create a singleton
export default new DBConnection();
