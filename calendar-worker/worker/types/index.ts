export interface Env {
  DB: any; // D1Database type
  ASSETS: any; // Fetcher type
  OPENAI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  [key: string]: any; // Index signature for Hono compatibility
}

export interface Event {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  tz: string;
  type?: string;
  flowchart?: string;
  echo_event_ids?: string;
  parent_event_id?: string;
  user_id?: string;
  eventType?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  source?: 'local' | 'google'; // Add source field for Google Calendar events
}

export interface CreateEventRequest {
  calendar_id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  tz: string;
  eventType?: string;
  location?: string;
  source?: 'local' | 'google';
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  tz?: string;
  eventType?: string;
  location?: string;
}

export interface WeatherResponse {
  data: any;
  status: string;
}

export interface EchoResponse {
  mermaid: string;
  events: any[];
}

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry?: string;
  scope: string;
  token_type: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  created: string;
  updated: string;
}
