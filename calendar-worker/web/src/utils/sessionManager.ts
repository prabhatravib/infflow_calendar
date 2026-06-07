/**
 * SessionManager: Manages session IDs for voice worker integration
 * Sessions persist across view changes but not page reloads
 */
class SessionManager {
  private sessionId: string | null = null;
  private listeners: ((sessionId: string | null) => void)[] = [];

  /**
   * Generate a new session ID
   */
  generateSessionId(): string {
    this.sessionId = this.generateUUID();
    this.notifyListeners();
    console.log('🆔 Generated new session ID:', this.sessionId);
    return this.sessionId;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Set an existing session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    this.notifyListeners();
    console.log('🆔 Session ID set to:', this.sessionId);
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    const oldSessionId = this.sessionId;
    this.sessionId = null;
    this.notifyListeners();
    console.log('🆔 Session cleared:', oldSessionId);
  }

  /**
   * Subscribe to session changes
   */
  onSessionChange(callback: (sessionId: string | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.sessionId));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

