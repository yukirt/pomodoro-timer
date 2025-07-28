import { PomodoroSession, DailyStats } from './types';
import { TimerMode } from '../timer/types';

export class SessionManager {
  private readonly STORAGE_KEY = 'pomodoro_sessions';
  private sessions: PomodoroSession[] = [];

  constructor() {
    this.loadSessions();
  }

  /**
   * 開始新的番茄鐘會話
   */
  startSession(mode: TimerMode, taskId?: string): string {
    const sessionId = this.generateSessionId();
    const session: PomodoroSession = {
      id: sessionId,
      startTime: new Date(),
      endTime: new Date(), // 將在完成時更新
      duration: 0, // 將在完成時計算
      mode,
      taskId,
      completed: false
    };

    this.sessions.push(session);
    this.saveSessions();
    return sessionId;
  }

  /**
   * 完成番茄鐘會話
   */
  completeSession(sessionId: string, completed: boolean = true): PomodoroSession | null {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) {
      return null;
    }

    const endTime = new Date();
    session.endTime = endTime;
    session.duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    session.completed = completed;

    this.saveSessions();
    return session;
  }

  /**
   * 取消番茄鐘會話
   */
  cancelSession(sessionId: string): boolean {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) {
      return false;
    }

    this.sessions.splice(index, 1);
    this.saveSessions();
    return true;
  }

  /**
   * 獲取所有會話
   */
  getAllSessions(): PomodoroSession[] {
    return [...this.sessions];
  }

  /**
   * 獲取指定日期的會話
   */
  getSessionsByDate(date: Date): PomodoroSession[] {
    const dateStr = this.formatDate(date);
    return this.sessions.filter(session => {
      const sessionDate = this.formatDate(session.startTime);
      return sessionDate === dateStr;
    });
  }

  /**
   * 獲取指定日期範圍的會話
   */
  getSessionsByDateRange(startDate: Date, endDate: Date): PomodoroSession[] {
    return this.sessions.filter(session => {
      const sessionDate = session.startTime;
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  /**
   * 獲取指定任務的會話
   */
  getSessionsByTask(taskId: string): PomodoroSession[] {
    return this.sessions.filter(session => session.taskId === taskId);
  }

  /**
   * 獲取已完成的會話
   */
  getCompletedSessions(): PomodoroSession[] {
    return this.sessions.filter(session => session.completed);
  }

  /**
   * 清除所有會話數據
   */
  clearAllSessions(): void {
    this.sessions = [];
    this.saveSessions();
  }

  /**
   * 清除指定日期之前的會話數據
   */
  clearSessionsBefore(date: Date): number {
    const initialCount = this.sessions.length;
    this.sessions = this.sessions.filter(session => session.startTime >= date);
    this.saveSessions();
    return initialCount - this.sessions.length;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadSessions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.sessions = parsed.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime)
        }));
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      this.sessions = [];
    }
  }

  private saveSessions(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }
}