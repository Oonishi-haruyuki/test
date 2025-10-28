
import { EventEmitter } from 'events';

// A simple event emitter to broadcast errors across the application.
// This allows different parts of the app to react to errors without being directly coupled.
export const errorEmitter = new EventEmitter();
