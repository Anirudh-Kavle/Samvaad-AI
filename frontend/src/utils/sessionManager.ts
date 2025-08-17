export class SessionManager {
  private static readonly SESSION_TOKEN_KEY = 'SESSION_TOKEN';
  private static readonly API_KEY = 'GROQ_API_KEY';

  static getSessionToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.SESSION_TOKEN_KEY);
  }

  static setSessionToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.SESSION_TOKEN_KEY, token);
  }

  static clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.SESSION_TOKEN_KEY);
    localStorage.removeItem(this.API_KEY);
  }

  static hasValidSession(): boolean {
    return !!this.getSessionToken();
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const sessionToken = this.getSessionToken();
    if (!sessionToken) {
      throw new Error('No session token found');
    }

    const headers = {
      ...options.headers,
      'X-Session-Token': sessionToken,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, clear the session
    if (response.status === 401) {
      this.clearSession();
      throw new Error('Session expired. Please start a new debate.');
    }

    return response;
  }
}