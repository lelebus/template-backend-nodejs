import { environment, log_level } from "../config";

import pino from "pino";
import pretty from "pino-pretty";

const logger =
  environment == "production"
    ? pino({
        level: log_level,
      })
    : pino(
        {
          level: log_level,
        },
        pretty({
          colorize: true,
        })
      );

export default logger;
