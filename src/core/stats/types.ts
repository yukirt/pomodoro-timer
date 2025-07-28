// Statistics types and interfaces
import { TimerMode } from '../timer/types';

export interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // 以秒為單位
  mode: TimerMode;
  taskId?: string; // 關聯的任務ID
  completed: boolean; // 是否完整完成（未被中斷）
}

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  completedPomodoros: number;
  totalWorkTime: number; // 以秒為單位
  totalBreakTime: number; // 以秒為單位
  sessions: PomodoroSession[];
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD format (Monday)
  weekEnd: string; // YYYY-MM-DD format (Sunday)
  totalPomodoros: number;
  totalWorkTime: number;
  totalBreakTime: number;
  dailyStats: DailyStats[];
}

export interface StatsFilter {
  startDate?: Date;
  endDate?: Date;
  taskId?: string;
  mode?: TimerMode;
  completedOnly?: boolean;
}

export interface StatsExportData {
  sessions: PomodoroSession[];
  dailyStats: DailyStats[];
  exportDate: Date;
  totalSessions: number;
  totalWorkTime: number;
}