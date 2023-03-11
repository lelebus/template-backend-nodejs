const { withFilter } = require("graphql-subscriptions");

const {
  graphql: {
    subscriptionTriggerNames: { NEW_NOTIFICATION },
  },
} = require("../../../config");

module.exports = {
  Subscription: {
    testNumberIncrement: {
      subscribe: (_, __, { pubsub }) =>
        pubsub.asyncIterator("NUMBER_INCREMENTED"),
    },
    newNotification: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator(NEW_NOTIFICATION),
        (payload, __, { req }) => {
          return req.userId === payload.newNotification.user;
        }
      ),
    },
  },
};
