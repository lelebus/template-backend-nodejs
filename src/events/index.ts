import fs from "fs";
import EventEmitter from "./emitter";

// load all subscribers
const subscribers = fs.readdirSync("src/events/subscribers/");
for (let i = 0; i < subscribers.length; i++) {
  import(`./subscribers/${subscribers[i]}`);
}

export const events = {
  // generic
  ADD: "add",
  UPDATE: "updated",
  DELETE: "delete",
  RESTORE: "restore",

  // notification
  NOTIFICATION_ADDED: "notification_added",
  NOTIFICATION_SENT: "notification_sent",

  // user
  USER_ADDED: "user_added",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
};

// exploit nodejs module caching system to create a singleton
export const emitter = EventEmitter;
