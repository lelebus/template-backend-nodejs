import { environment } from "../config";

// server
import express from "express";
import { ApolloServer, ApolloError } from "apollo-server-express";
import { graphqlUploadExpress } from "graphql-upload";
import { createServer } from "http";
import executableSchema from "./schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";

// errors
import {
  BadRequestError,
  InvalidUserInputError,
  NotFoundError,
} from "../utils/errors";
import httpResponseCodes from "../utils/httpResponseCodes";
import { AuthenticationError, ForbiddenError } from "apollo-server";

// authentication
import cookieParser from "cookie-parser";
import authentication from "./middlewares/authentication";

// logging
import logging from "./middlewares/logging";
import logger from "../utils/logger";

// useful plugins for proper shutdown
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginUsageReportingDisabled,
} from "apollo-server-core";
import { Disposable } from "graphql-ws";

//////////////////////////////////
//
// GraphQL Server
//
//////////////////////////////////

export class GraphQLServer {
  private environment;
  private path: string;
  private port: string;

  private server: ApolloServer;
  private wsServerDisposable: Disposable;
  private httpServer: any;

  public pubsub: PubSub;

  constructor(environment, path, port) {
    this.environment = environment;
    this.path = path;
    this.port = port;
  }

  async start() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(graphqlUploadExpress());
    app.use(logging);
    app.use(authentication);

    this.httpServer = createServer(app);

    //////////////////////////////////
    //
    // Initialize and start WebSocket Server
    //
    //////////////////////////////////
    const pubsub = new PubSub();
    this.pubsub = pubsub;

    // get context for each request
    const getDynamicContext = async (ctx, msg, args) => {
      // parse cookie string to object
      const cookieParser = (requestCookieString) => {
        if (requestCookieString === "") {
          return {};
        }

        let pairs = requestCookieString.split(";");
        let splittedPairs = pairs.map((cookie) => cookie.split("="));

        const cookieObj = splittedPairs.reduce(function (obj, cookie) {
          obj[decodeURIComponent(cookie[0].trim())] = decodeURIComponent(
            cookie[1].trim()
          );
          return obj;
        }, {});

        return cookieObj;
      };

      // check user's identity from JWT cookie
      const req = {
        cookies: cookieParser(ctx.extra.request.headers.cookie),
        userId: null,
        userRole: null,
      };
      await authentication(req, {}, () => {});

      return {
        pubsub,
        req: {
          userId: req.userId,
          userRole: req.userRole,
        },
      };
    };

    let wsServerDisposable;
    if (this.environment != "test") {
      const wsServer = new WebSocketServer({
        server: this.httpServer,
      });

      wsServerDisposable = useServer(
        {
          schema: executableSchema,
          context: async (ctx, msg, args) => getDynamicContext(ctx, msg, args),
        },
        wsServer
      );
      this.wsServerDisposable = wsServerDisposable;
    }

    //////////////////////////////////
    //
    // Initialize and start HTTP ApolloServer
    //
    //////////////////////////////////
    const mocks = {
      Int: () => 13,
      Float: () => 16.31,
      String: () => "Hello CodeWorks",

      Date: () => {
        return new Date();
      },
      Url: () => "https://fbwcdn.com/contents/profile/image/250/8/85/85da68bbe02bcfdce34619aa656c81ab.jpg",
      
      User: () => ({
        email: "mocked@email.com",
      }),
    };

    let mocksActive: any = false;
    let mockEntireSchema = false;

    if (this.environment == "dev") {
      mocksActive = mocks;
    }
    if (this.environment == "mock") {
      mocksActive = mocks;
      mockEntireSchema = true;
    }

    this.server = new ApolloServer({
      debug: true,
      mocks: mocksActive,
      mockEntireSchema,

      schema: executableSchema,
      plugins: [
        ApolloServerPluginUsageReportingDisabled(),

        // Proper shutdown for the HTTP and WebSocket servers
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                if (environment != "test") {
                  await wsServerDisposable.dispose();
                }
              },
            };
          },
        },
      ],

      // handle error codes and messages, based on type of error and environment
      formatError: (err) => {
        switch (err.originalError.constructor) {
          case BadRequestError:
            logger.error(
              {
                path: err.path,
                stacktrace: err.extensions.exception.stacktrace,
              },
              `graphql => BadRequestError`
            );
            return new ApolloError(
              "Bad Request.",
              httpResponseCodes["BAD_REQUEST"],
              this.environment != "production"
                ? { ...err.extensions, message: err.message }
                : { message: err.message }
            );

          case AuthenticationError:
            logger.error(
              {
                path: err.path,
                stacktrace: err.extensions.exception.stacktrace,
              },
              `graphql => AuthenticationError`
            );
            return new ApolloError(
              "Unauthenticated.",
              httpResponseCodes["UNAUTHENTICATED"],
              this.environment != "production"
                ? { ...err.extensions, message: err.message }
                : { message: err.message }
            );

          case ForbiddenError:
            logger.error(
              {
                path: err.path,
                stacktrace: err.extensions.exception.stacktrace,
              },
              `graphql => ForbiddenError`
            );
            return new ApolloError(
              "Forbidden",
              httpResponseCodes["FORBIDDEN"],
              this.environment != "production"
                ? { ...err.extensions, message: err.message }
                : { message: err.message }
            );

          case NotFoundError:
            logger.error(
              {
                path: err.path,
                stacktrace: err.extensions.exception.stacktrace,
              },
              `graphql => NotFoundError`
            );
            return new ApolloError(
              "Not Found",
              httpResponseCodes["NOT_FOUND"],
              this.environment != "production"
                ? { ...err.extensions, message: err.message }
                : { message: err.message }
            );

          case InvalidUserInputError:
            logger.error(
              {
                path: err.path,
                stacktrace: err.extensions.exception.stacktrace,
              },
              `graphql => InvalidUserInputError`
            );
            return new ApolloError(
              "Invalid Input",
              httpResponseCodes["BAD_USER_INPUT"],
              this.environment != "production"
                ? {
                    ...err.extensions,
                    field: err.extensions.field,
                    message: err.message,
                  }
                : {
                    field: err.extensions.field,
                    message: err.extensions.message,
                  }
            );

          default:
            logger.error(
              { stacktrace: err.extensions.exception.stacktrace },
              `generic => ${err.message}`
            );
            return new ApolloError(
              "Internal Server Error",
              httpResponseCodes["INTERNAL_SERVER_ERROR"],
              this.environment != "production" ? err.extensions : null
            );
        }
      },
      context: ({ req, res }) => ({ req, res, pubsub }),
    });

    // Allow mixed origin requests to support requests from other localhost ports in dev mode
    let cors = undefined;
    if (environment != "production") {
      cors = {
        origin: true,
        credentials: true,
      };
    }

    await this.server.start();
    this.server.applyMiddleware({
      app,
      path: this.path,
      cors,
    });

    //////////////////////////////////
    //
    // Listen
    //
    //////////////////////////////////

    this.httpServer.listen({ port: this.port }, () => {
      logger.info(
        `🚀 GraphQL Server ready at http://localhost:${this.port}${this.path}`
      );
      if (environment != "test") {
        logger.info(
          `🚀 GraphQL Subscription endpoint ready at ws://localhost:${this.port}${this.path}`
        );
      }
    });
  }

  async stop() {
    await this.httpServer.close();

    if (environment != "test") {
      await this.wsServerDisposable.dispose();
    }
    await this.server.stop();
    logger.info("GraphQL Server stopped");
  }
}
