import { MoodId } from './theme';

export interface MoodEntry {
  id: string;
  mood: MoodId;
  createdAt: string; // ISO string
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  createdAt: string;
}

export interface NoteFolder {
  id: string;
  name: string;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  folderId?: string | null;
  imageUri?: string | null;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  updatedAt: string;
}

export function formatRelativeTime(iso: string, now = new Date()): string {
  const diffSec = Math.floor((now.getTime() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function formatMonthDayYear(d: Date): string {
  const months = [
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.',
    'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTimeOfDay(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${d.getHours() >= 12 ? 'pm' : 'am'}`;
}

export function weekDaysFor(anchor: Date): Date[] {
  const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const mondayOffset = (base.getDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(base);
  monday.setDate(base.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function latestMoodByDay(
  entries: MoodEntry[],
  anchor: Date
): Partial<Record<number, MoodId>> {
  const days = weekDaysFor(anchor);
  const out: Partial<Record<number, MoodId>> = {};
  days.forEach((day, idx) => {
    const matches = entries
      .filter((e) => isSameDay(new Date(e.createdAt), day))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (matches.length > 0) out[idx] = matches[0].mood;
  });
  return out;
}
