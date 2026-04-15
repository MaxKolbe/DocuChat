import { EventEmitter } from "events"; //inbuilt nodejs module

// One emitter for the entire application
export const appEvents = new EventEmitter();

// Increased default limit to 20
appEvents.setMaxListeners(20);
