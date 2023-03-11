import { emitter, events } from "../index";
import logger from "../../utils/logger";
import db from "../../data-access";

emitter.on(events.USER_ADDED, (payload: any) => {
  logger.info({ user: payload.data.user }, "application => user added");

  // history
  try {
    emitter.emit(events.ADD, {
      service: payload.service,
      id: payload.data.user.id,
      type: "USER",
    });
  } catch (e) {
    logger.error(e);
  }
});

emitter.on(events.USER_UPDATED, (payload: any) => {
  logger.info({ user: payload.data.user }, "application => user updated");

  // history
  try {
    emitter.emit(events.UPDATE, {
      service: payload.service,
      id: payload.data.user.id,
      type: "USER",
    });
  } catch (e) {
    logger.error(e);
  }
});

emitter.on(events.USER_DELETED, (payload: any) => {
  logger.info({ user: payload.data.user }, "application => user deleted");

  // history
  try {
    emitter.emit(events.DELETE, {
      service: payload.service,
      id: payload.data.user.id,
      type: "USER",
    });
  } catch (e) {
    logger.error(e);
  }
});

export default emitter;
