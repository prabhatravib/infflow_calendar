import { GoogleOAuthTokens, GoogleCalendarEvent } from '../types';

export class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(env: any) {
    this.clientId = env.GOOGLE_CLIENT_ID;
    this.clientSecret = env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = env.GOOGLE_REDIRECT_URI;
  }

  /**
   * Generate the Google OAuth authorization URL
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokens = await response.json();
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
      scope: tokens.scope,
      token_type: tokens.token_type,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokens = await response.json();
    return {
      access_token: tokens.access_token,
      refresh_token: refreshToken, // Keep the existing refresh token
      expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
      scope: tokens.scope,
      token_type: tokens.token_type,
    };
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(accessToken: string, timeMin?: string, timeMax?: string, maxResults: number = 100): Promise<GoogleCalendarEvent[]> {
    const calendarUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    
    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(`${calendarUrl}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(tokens: GoogleOAuthTokens): boolean {
    if (!tokens.expiry) return false;
    return new Date(tokens.expiry) <= new Date();
  }

  /**
   * Convert Google Calendar event to our Event format
   */
  convertGoogleEventToEvent(googleEvent: GoogleCalendarEvent, userId: string): any {
    const startTime = googleEvent.start.dateTime || googleEvent.start.date;
    const endTime = googleEvent.end.dateTime || googleEvent.end.date;
    const isAllDay = !googleEvent.start.dateTime;

    return {
      id: googleEvent.id,
      calendar_id: 'primary',
      title: googleEvent.summary || 'Untitled',
      description: googleEvent.description || '',
      location: googleEvent.location || '',
      start: startTime,
      end: endTime,
      tz: googleEvent.start.timeZone || 'UTC',
      eventType: 'other',
      source: 'google',
      user_id: userId,
      created_at: googleEvent.created,
      updated_at: googleEvent.updated,
    };
  }
}
