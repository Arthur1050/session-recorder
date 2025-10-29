import { RecordingSession, StorageAdapter } from "../../types/events";
import { LocalStorageAdapter } from "../../storage/local-storage";

/**
 * Manages storage operations for session recordings
 */
export class SessionStorage {
  private storageAdapter: StorageAdapter;

  constructor(
    adapter?: StorageAdapter,
    storageKey: string = "session_recordings"
  ) {
    this.storageAdapter = adapter || new LocalStorageAdapter(storageKey);
  }

  /**
   * Saves a session
   */
  async saveSession(session: RecordingSession): Promise<void> {
    return this.storageAdapter.saveSession(session);
  }

  /**
   * Gets a session by ID
   */
  async getSession(id: string): Promise<RecordingSession | null> {
    return this.storageAdapter.getSession(id);
  }

  /**
   * Gets all stored sessions
   */
  async getAllSessions(): Promise<RecordingSession[]> {
    return this.storageAdapter.getAllSessions();
  }

  /**
   * Deletes a session by ID
   */
  async deleteSession(id: string): Promise<void> {
    return this.storageAdapter.deleteSession(id);
  }
}
