const cron = require("node-cron");

import { jest } from "./config";

export function cronFunction() {
  if (jest.jestWorkerId) return;

  cron.schedule("*/30 * * * *", async function () {
    // call functions here
  });
}
