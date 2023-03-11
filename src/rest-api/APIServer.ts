const express = require("express");

import logger from "../utils/logger";
import { environment } from "../config";

//////////////////////////////////
//
// GraphQL Server
//
//////////////////////////////////

export class APIServer {
  private environment;
  private port: string;

  private server: any;

  constructor(environment, port) {
    this.environment = environment;
    this.port = port;
  }

  async start() {
    const app = express();

    // app.use(cors());

    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST");
      res.header("Access-Control-Expose-Headers", "Content-Length");
      res.header(
        "Access-Control-Allow-Headers",
        "Accept, Authorization, Content-Type, X-Requested-With, Range"
      );
      res.header("Content-Type", "application/json");
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      } else {
        return next();
      }
    });

    // Keep body raw for stripe webhook endpoints
    app.use("/api/webhooks/stripe", express.raw({ type: "*/*" }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/api/", require("./_router"));

    this.server = app;
    this.server.listen({ port: this.port }, () => {
      logger.info(
        `🚀 REST API server ready at http://localhost:${this.port}/api/`
      );
    });
  }
}
