const Notification = require("../../../services/notification/notification.service");

module.exports = {
  Query: {
    getMyNotifications: async (_, { offset, limit }, { req }) => {
      if (!req.userId) {
        return [];
      }

      return Notification.getByUserId(req.userId, offset, limit);
    },
  },
};
