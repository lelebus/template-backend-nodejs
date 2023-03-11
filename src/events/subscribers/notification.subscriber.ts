import logger from "../../utils/logger";
import { emitter, events } from "../index";

import { graphQLServer } from "../../index";
import { graphql } from "../../config";

const pubsub = graphQLServer.pubsub;
const NEW_NOTIFICATION = graphql.subscriptionTriggerNames.NEW_NOTIFICATION;

emitter.on(events.NOTIFICATION_ADDED, (payload: any) => {
  const notification = payload.data.notification;
  logger.info({ notification }, "application => notification added");

  // publish to graphql pubsub
  pubsub.publish(NEW_NOTIFICATION, {
    newNotification: notification,
  });

  // history
  try {
    emitter.emit(events.ADD, {
      service: payload.service,
      notification,
    });
  } catch (e) {
    logger.error(e);
  }
});

export default emitter;
