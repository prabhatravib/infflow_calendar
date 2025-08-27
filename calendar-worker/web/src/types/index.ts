export interface Event {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  tz: string;
  created_at: string;
  updated_at: string;
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
  all_day?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  type?: string;
  flowchart?: string;
  echo_event_ids?: string;
  parent_event_id?: string;
  user_id?: string;
}

export interface CreateEventRequest {
  calendar_id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  tz: string;
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  tz?: string;
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
}
