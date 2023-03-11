const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const { GraphQLUpload } = require("graphql-upload");

module.exports = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "ISO Date custom scalar type",
    serialize(value) {
      try {
        return new Date(value).toISOString();
      } catch (e) {
        return null;
      }
    },
    parseValue(value) {
      try {
        return value == null ? null : new Date(value);
      } catch (e) {
        return null;
      }
    },
    parseLiteral(ast) {
      return ast.kind === Kind.STRING ? new Date(ast.value) : null;
    },
  }),
  Upload: GraphQLUpload,
  Url: new GraphQLScalarType({
    name: "Url",
  }),
};
