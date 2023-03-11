const { AuthenticationError } = require("apollo-server");

const User = require("../../../../services/core/user.service");

module.exports = {
  Query: {
    existsUser: async (_, { email }, __) => {
      return await User.emailExists(email);
    },

    me: async (_, __, { req }) => {
      if (!req.userId) {
        throw new AuthenticationError("Please, log in.");
      }

      return await User.getById(req.userId);
    },
  },
};
