import { ApolloError } from "apollo-server-express";

export class BadRequestError extends ApolloError {
  constructor(message) {
    super(message, "BAD_REQUEST");

    Object.defineProperty(this, "name", { value: "BadRequestError" });
  }
}

export class NotFoundError extends ApolloError {
  constructor(message) {
    super(message, "NOT_FOUND");

    Object.defineProperty(this, "name", { value: "NotFoundError" });
  }
}

export class InvalidUserInputError extends ApolloError {
  constructor(field, message) {
    super(message, "BAD_USER_INPUT", {
      field,
      message,
    });

    Object.defineProperty(this, "name", { value: "InvalidUserInput" });
  }
}

export class InternalServerError extends ApolloError {
  constructor(message) {
    super(message, "INTERNAL_SERVER_ERROR");

    Object.defineProperty(this, "name", { value: "InternalServerError" });
  }
}
