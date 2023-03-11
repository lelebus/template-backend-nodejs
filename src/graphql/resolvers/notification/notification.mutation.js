const { ForbiddenError } = require("apollo-server");
const { NotFoundError } = require("../../../utils/errors");

const Notification = require("../../../services/notification/notification.service");

module.exports = {
  Mutation: {
    toggleNotificationReadStatus: async (_, { id }, { req }) => {
      const notification = await Notification.getById(id).catch((err) => {
        if (err instanceof NotFoundError) {
          return { user: null };
        }
      });
      if (notification.user !== req.userId) {
        throw new ForbiddenError("This notification is not for you.");
      }

      return Notification.toggleReadStatus(id);
    },
  },
};
