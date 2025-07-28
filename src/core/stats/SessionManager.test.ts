import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionManager } from './SessionManager';
import { TimerMode } from '../timer/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('startSession', () => {
    it('should create a new session with correct properties', () => {
      const mode: TimerMode = 'work';
      const taskId = 'task-123';
      
      const sessionId = sessionManager.startSession(mode, taskId);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      
      const sessions = sessionManager.getAllSessions();
      expect(sessions).toHaveLength(1);
      
      const session = sessions[0];
      expect(session.id).toBe(sessionId);
      expect(session.mode).toBe(mode);
      expect(session.taskId).toBe(taskId);
      expect(session.completed).toBe(false);
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.duration).toBe(0);
    });

    it('should create session without taskId', () => {
      const mode: TimerMode = 'shortBreak';
      
      const sessionId = sessionManager.startSession(mode);
      const sessions = sessionManager.getAllSessions();
      
      expect(sessions[0].taskId).toBeUndefined();
    });

    it('should save session to localStorage', () => {
      sessionManager.startSession('work');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro_sessions',
        expect.any(String)
      );
    });
  });

  describe('completeSession', () => {
    it('should complete an existing session', () => {
      const sessionId = sessionManager.startSession('work');
      
      // Wait a bit to ensure duration > 0
      vi.advanceTimersByTime(1000);
      
      const completedSession = sessionManager.completeSession(sessionId);
      
      expect(completedSession).toBeDefined();
      expect(completedSession!.completed).toBe(true);
      expect(completedSession!.duration).toBeGreaterThan(0);
      expect(completedSession!.endTime).toBeInstanceOf(Date);
    });

    it('should mark session as incomplete when specified', () => {
      const sessionId = sessionManager.startSession('work');
      
      const completedSession = sessionManager.completeSession(sessionId, false);
      
      expect(completedSession!.completed).toBe(false);
    });

    it('should return null for non-existent session', () => {
      const result = sessionManager.completeSession('non-existent-id');
      
      expect(result).toBeNull();
    });

    it('should calculate duration correctly', () => {
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T10:25:00Z');
      
      vi.setSystemTime(startTime);
      const sessionId = sessionManager.startSession('work');
      
      vi.setSystemTime(endTime);
      const completedSession = sessionManager.completeSession(sessionId);
      
      expect(completedSession!.duration).toBe(1500); // 25 minutes = 1500 seconds
    });
  });

  describe('cancelSession', () => {
    it('should remove session from list', () => {
      const sessionId = sessionManager.startSession('work');
      
      expect(sessionManager.getAllSessions()).toHaveLength(1);
      
      const result = sessionManager.cancelSession(sessionId);
      
      expect(result).toBe(true);
      expect(sessionManager.getAllSessions()).toHaveLength(0);
    });

    it('should return false for non-existent session', () => {
      const result = sessionManager.cancelSession('non-existent-id');
      
      expect(result).toBe(false);
    });
  });

  describe('getSessionsByDate', () => {
    it('should return sessions for specific date', () => {
      const date1 = new Date('2025-01-01T10:00:00Z');
      const date2 = new Date('2025-01-02T10:00:00Z');
      
      vi.setSystemTime(date1);
      sessionManager.startSession('work');
      
      vi.setSystemTime(date2);
      sessionManager.startSession('shortBreak');
      
      const sessionsDate1 = sessionManager.getSessionsByDate(date1);
      const sessionsDate2 = sessionManager.getSessionsByDate(date2);
      
      expect(sessionsDate1).toHaveLength(1);
      expect(sessionsDate1[0].mode).toBe('work');
      expect(sessionsDate2).toHaveLength(1);
      expect(sessionsDate2[0].mode).toBe('shortBreak');
    });

    it('should return empty array for date with no sessions', () => {
      const sessions = sessionManager.getSessionsByDate(new Date('2025-01-01'));
      
      expect(sessions).toHaveLength(0);
    });
  });

  describe('getSessionsByDateRange', () => {
    it('should return sessions within date range', () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const midDate = new Date('2025-01-02T12:00:00Z');
      const endDate = new Date('2025-01-03T23:59:59Z');
      const outsideDate = new Date('2025-01-05T12:00:00Z');
      
      vi.setSystemTime(startDate);
      sessionManager.startSession('work');
      
      vi.setSystemTime(midDate);
      sessionManager.startSession('shortBreak');
      
      vi.setSystemTime(outsideDate);
      sessionManager.startSession('longBreak');
      
      const sessions = sessionManager.getSessionsByDateRange(startDate, endDate);
      
      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.mode)).toEqual(['work', 'shortBreak']);
    });
  });

  describe('getSessionsByTask', () => {
    it('should return sessions for specific task', () => {
      const taskId = 'task-123';
      
      sessionManager.startSession('work', taskId);
      sessionManager.startSession('work', 'other-task');
      sessionManager.startSession('shortBreak', taskId);
      
      const sessions = sessionManager.getSessionsByTask(taskId);
      
      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.taskId === taskId)).toBe(true);
    });
  });

  describe('getCompletedSessions', () => {
    it('should return only completed sessions', () => {
      const sessionId1 = sessionManager.startSession('work');
      const sessionId2 = sessionManager.startSession('shortBreak');
      
      sessionManager.completeSession(sessionId1, true);
      sessionManager.completeSession(sessionId2, false);
      
      const completedSessions = sessionManager.getCompletedSessions();
      
      expect(completedSessions).toHaveLength(1);
      expect(completedSessions[0].id).toBe(sessionId1);
    });
  });

  describe('clearAllSessions', () => {
    it('should remove all sessions', () => {
      sessionManager.startSession('work');
      sessionManager.startSession('shortBreak');
      
      expect(sessionManager.getAllSessions()).toHaveLength(2);
      
      sessionManager.clearAllSessions();
      
      expect(sessionManager.getAllSessions()).toHaveLength(0);
    });
  });

  describe('clearSessionsBefore', () => {
    it('should remove sessions before specified date', () => {
      const oldDate = new Date('2025-01-01T10:00:00Z');
      const newDate = new Date('2025-01-03T10:00:00Z');
      const cutoffDate = new Date('2025-01-02T00:00:00Z');
      
      vi.setSystemTime(oldDate);
      sessionManager.startSession('work');
      
      vi.setSystemTime(newDate);
      sessionManager.startSession('shortBreak');
      
      const removedCount = sessionManager.clearSessionsBefore(cutoffDate);
      const remainingSessions = sessionManager.getAllSessions();
      
      expect(removedCount).toBe(1);
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].mode).toBe('shortBreak');
    });
  });

  describe('localStorage integration', () => {
    it('should load sessions from localStorage on initialization', () => {
      const mockSessions = [
        {
          id: 'session-1',
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T10:25:00Z',
          duration: 1500,
          mode: 'work',
          completed: true
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessions));
      
      const newSessionManager = new SessionManager();
      const sessions = newSessionManager.getAllSessions();
      
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[0].startTime).toBeInstanceOf(Date);
      expect(sessions[0].endTime).toBeInstanceOf(Date);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const newSessionManager = new SessionManager();
      
      expect(newSessionManager.getAllSessions()).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load sessions from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage save error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      sessionManager.startSession('work');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save sessions to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});