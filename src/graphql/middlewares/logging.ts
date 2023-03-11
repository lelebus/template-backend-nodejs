import logger from "../../utils/logger";

export default (req, _, next) => {
  // do not log OPTIONS requests
  if (req.method == "OPTIONS") {
    return next();
  }

  // do not log Instrospection
  if (req.body.operationName == "IntrospectionQuery") {
    return next();
  }

  // add metadata
  let metadata = {}

  // obscurate passwords
  if (req.body.variables && req.body.variables.password) {
    metadata["password"] = "******";
  }

  logger.info(
    `graphql => ${req.body.query} variables: ${JSON.stringify(
      {...req.body.variables, ...metadata}
    )}`
  );

  return next();
};
