const { AuthenticationError, ForbiddenError } = require("apollo-server");

const Auth = require("../../../../services/core/auth.service");
const User = require("../../../../services/core/user.service");
const { accessTokenBody, refreshTokenBody } = require("../../../../config");

module.exports = {
  Mutation: {

    login: async (_, { email, password }, { res }) => {
      const user = await Auth.login(email, password);
      if (user == null) {
        throw new AuthenticationError("Wrong credentials");
      }

      setAuthCookies(user, res);

      return user;
    },

    logout: async (_, __, { res }) => {
      res.clearCookie("access-token");
      res.clearCookie("refresh-token");

      return true;
    },

    sendUserPasswordResetToken: async (_, { email }, __) => {
      return Auth.sendUserPasswordResetToken(email);
    },

    resetUserPassword: async (
      _,
      { email, newPassword, token },
      { req, res }
    ) => {
      // verify user
      let user = await User.getByEmail(email).catch((e) => {
        if (e.extensions.code === "NOT_FOUND") {
          throw new ForbiddenError("Wrong credentials.");
        }
      });
      const verified = await Auth.verifyResetToken(user.id, token);
      if (!verified) {
        throw new ForbiddenError("Wrong credentials.");
      }

      user = await Auth.setPassword(user.id, newPassword);
      if (!user) {
        return false;
      }

      // renew cookies with new resetCount
      if (req.userId == user.id) {
        setAuthCookies(user, res);
      }

      return true;
    },

    sendUserEmailChangeToken: async (_, { email }, { req }) => {
      if (!req.userId) {
        throw new AuthenticationError("Please, log in.");
      }

      // only owner and admins have permission
      let user = await User.getByEmail(email);
      if (user.id != req.userId) {
        throw new ForbiddenError("You can not change another user's data.");
      }

      return Auth.sendUserEmailChangeToken(email);
    },

    changeUserEmail: async (_, { userId, newEmail, token }, { req, res }) => {
      // verify user
      const verified = await Auth.verifyResetToken(userId, token);
      if (!verified) {
        throw new ForbiddenError("Wrong credentials.");
      }

      const user = await Auth.setEmail(userId, newEmail);
      if (!user) {
        return false;
      }

      // renew cookies with new resetCount
      if (req.userId == user.id) {
        setAuthCookies(user, res);
      }

      return true;
    },
  },
};

function setAuthCookies(user, res) {
  const { accessToken, refreshToken } = Auth.createCookieTokens(user);
  res.cookie("access-token", accessToken, accessTokenBody);
  res.cookie("refresh-token", refreshToken, refreshTokenBody);
}
