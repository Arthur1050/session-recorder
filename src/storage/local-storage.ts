import { RecordingSession, StorageAdapter } from "../types/events";
import { safeParseJSON } from "../utils/helpers";

/**
 * Storage adapter that uses localStorage to save session recordings
 */
export class LocalStorageAdapter implements StorageAdapter {
  private storageKey: string;

  constructor(storageKey: string = "session_recordings") {
    this.storageKey = storageKey;
  }

  /**
   * Save a session to localStorage
   */
  async saveSession(session: RecordingSession): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const existingIndex = sessions.findIndex((s) => s.id === session.id);

      if (existingIndex >= 0) {
        sessions[existingIndex] = this.prepareSessionForStorage(session);
      } else {
        sessions.push(this.prepareSessionForStorage(session));
      }

      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (err) {
      console.error("Failed to save session to localStorage:", err);
      throw err;
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(id: string): Promise<RecordingSession | null> {
    try {
      const sessions = await this.getAllSessions();
      const session = sessions.find((s) => s.id === id);

      if (!session) return null;

      return this.prepareSessionFromStorage(session);
    } catch (err) {
      console.error("Failed to get session from localStorage:", err);
      return null;
    }
  }

  /**
   * Get all sessions from localStorage
   */
  async getAllSessions(): Promise<RecordingSession[]> {
    try {
      const sessionsJson = localStorage.getItem(this.storageKey);
      if (!sessionsJson) return [];

      const sessions = safeParseJSON<unknown[]>(sessionsJson, []);
      return sessions.map(this.prepareSessionFromStorage);
    } catch (err) {
      console.error("Failed to get all sessions from localStorage:", err);
      return [];
    }
  }

  /**
   * Delete a session by ID
   */
  async deleteSession(id: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter((s) => s.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredSessions));
    } catch (err) {
      console.error("Failed to delete session from localStorage:", err);
      throw err;
    }
  }

  /**
   * Prepare session for saving to storage by converting dates to strings
   */
  private prepareSessionForStorage(
    session: RecordingSession
  ): RecordingSession {
    return {
      ...session,
      startTime: session.startTime,
      endTime: session.endTime,
      events: session.events.map((event) => ({
        ...event,
        timestamp: event.timestamp,
      })),
    } as RecordingSession;
  }

  /**
   * Prepare session from storage by converting strings to Date objects
   */
  private prepareSessionFromStorage(session: unknown): RecordingSession {
    const typedSession = session as {
      startTime: string;
      endTime: string;
      events: Array<{ timestamp: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };

    return {
      ...typedSession,
      startTime: new Date(typedSession.startTime),
      endTime: new Date(typedSession.endTime),
      events: typedSession.events.map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      })) as RecordingSession["events"],
    } as RecordingSession;
  }
}
