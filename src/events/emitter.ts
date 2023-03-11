import { EventEmitter } from "events";

// exploit nodejs module caching system to create a singleton
export default new EventEmitter();  