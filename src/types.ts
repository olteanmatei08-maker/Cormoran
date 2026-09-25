export interface PatrolLeader {
  name: string;
  period: string;
  startYear: number;
  endYear: number;
  isCurrent?: boolean;
  isFounder?: boolean;
  notes?: string;
}

export interface ScoutLaw {
  number: number;
  title: string;
  description: string;
  category: string;
}

export interface ScoutPrinciple {
  id: number;
  text: string;
  domain: string;
}

export interface ScoutTrail {
  id: string;
  name: string;
  colorName: string;
  badgeColor: string;
  accentBorder: string;
  accentBg: string;
  description: string;
  skills: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO string or YYYY-MM-DD
  end: string;   // ISO string or YYYY-MM-DD
  hasTime?: boolean; // true only if specific hours are set in Google Calendar
  category: 'adunare' | 'drumetie' | 'campism' | 'tehnici' | 'ecologie' | 'ceremonie';
  googleEventId?: string;
  htmlLink?: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
