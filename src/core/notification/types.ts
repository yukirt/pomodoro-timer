export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  sound?: string;
}

export interface SoundOptions {
  volume?: number; // 0-1
  loop?: boolean;
}

export type SoundType = 'work-complete' | 'break-complete' | 'tick' | 'alert';

export interface NotificationConfig {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  selectedSound: SoundType;
  volume: number;
}