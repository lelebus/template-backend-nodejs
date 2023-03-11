import { environment, graphql, api } from "./config";
import logger from "./utils/logger";

import * as Mock from "./__tests__/db_setup";

//////////////////////////////////
//
// Start Servers
//
//////////////////////////////////

import db from "./data-access";
if (environment === "dev") {
  db.connection.truncate().then(() => {
    db.connection.sync({ force: true }).then(() => {
      // populate staging server
      setupDevelopmentDB().then(() => {
        logger.info("Development DB populated");
      });
    });
  });
}

// GraphQL Server
import { GraphQLServer } from "./graphql/GraphQLServer";
const graphQLServer = new GraphQLServer(
  environment,
  graphql.path,
  graphql.port
);
graphQLServer.start();

// EXAMPLE GraphQL Subscription
// In the background, increment a number every second and notify subscribers when it changes.
if (environment != "test") {
  let currentNumber = 0;
  const testNumberIncrement = () => {
    graphQLServer.pubsub.publish("NUMBER_INCREMENTED", {
      testNumberIncrement: currentNumber++,
    });
    setTimeout(testNumberIncrement, 1000);
  };
  testNumberIncrement();
}

// REST API Server
import { APIServer } from "./rest-api/APIServer";
const apiServer = new APIServer(environment, api.port);
if (environment != "test") {
  apiServer.start();
}

// CRON JOB
import { cronFunction } from "./cron";
cronFunction();

export { graphQLServer, apiServer };

async function setupDevelopmentDB() {
  await Mock.cleanDb();

  await Mock.insertUsers();
}
