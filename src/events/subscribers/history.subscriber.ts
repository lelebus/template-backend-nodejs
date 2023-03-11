import { emitter, events } from "../index";

emitter.on(events.ADD, (data: any) => {
  // do something
});

emitter.on(events.UPDATE, (data: any) => {
  // do something
});

emitter.on(events.DELETE, (data: any) => {
  // do something
});

emitter.on(events.RESTORE, (data: any) => {
  // do something
});

export default emitter;
