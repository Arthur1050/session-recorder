import { SessionRecorder } from "./core/recorder";
import { SessionReplayer } from "./core/replayer";
import { SessionPlayer } from "./core/player";
import { LocalStorageAdapter } from "./storage/local-storage";
import {
  RecordingSession,
  SessionEvent,
  EventType,
  RecorderOptions,
  ReplayOptions,
  StorageAdapter,
} from "./types/events";
import * as helpers from "./utils/helpers";

// Export all public components
export {
  SessionRecorder,
  SessionReplayer,
  SessionPlayer,
  LocalStorageAdapter,
  RecordingSession,
  SessionEvent,
  EventType,
  RecorderOptions,
  ReplayOptions,
  StorageAdapter,
  helpers,
};

// Export default recorder for convenience
export default SessionRecorder;

// Make available in global context
if (typeof window !== "undefined") {
  (window as any).SessionRecorder = SessionRecorder;
  (window as any).SessionReplayer = SessionReplayer;
  (window as any).SessionPlayer = SessionPlayer;
}

// Ensure compatibility with UMD
if (typeof globalThis !== "undefined") {
  (globalThis as any).SessionRecorder = SessionRecorder;
  (globalThis as any).SessionReplayer = SessionReplayer;
  (globalThis as any).SessionPlayer = SessionPlayer;
}
