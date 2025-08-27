export interface Env {
  DB: any; // D1Database type
  ASSETS: any; // Fetcher type
<<<<<<< HEAD
  USER_ID: string;
  OPENAI_API_KEY: string;
=======
  OPENAI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
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
<<<<<<< HEAD
=======
  source?: 'local' | 'google'; // Add source field for Google Calendar events
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
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
<<<<<<< HEAD
=======
  source?: 'local' | 'google';
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
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
<<<<<<< HEAD
=======

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
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
