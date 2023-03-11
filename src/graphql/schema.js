const { makeExecutableSchema } = require("@graphql-tools/schema");

const path = require("path");
const { loadFilesSync } = require("@graphql-tools/load-files");
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");

// typeDefs
const typesArray = loadFilesSync(path.join(__dirname, "./types"), {
  extensions: ["gql", "graphql"],
  recursive: true,
});
const typeDefs = mergeTypeDefs(typesArray);

// resolvers
const resolversArray = loadFilesSync(path.join(__dirname, "./resolvers"), {
  extensions: ["js"],
});
const resolvers = mergeResolvers(resolversArray);

const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

module.exports = executableSchema;
