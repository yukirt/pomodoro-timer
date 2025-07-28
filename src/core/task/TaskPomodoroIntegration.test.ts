// TaskPomodoroIntegration unit tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskPomodoroIntegration } from './TaskPomodoroIntegration';
import { TaskManager } from './TaskManager';
import { SessionManager } from '../stats/SessionManager';
import { Task } from './types';
import { PomodoroSession } from '../stats/types';
import { TimerMode } from '../timer/types';

// Mock dependencies
vi.mock('./TaskManager');
vi.mock('../stats/SessionManager');

describe('TaskPomodoroIntegration', () => {
  let integration: TaskPomodoroIntegration;
  let mockTaskManager: TaskManager;
  let mockSessionManager: SessionManager;

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    isCompleted: false,
    estimatedPomodoros: 3,
    completedPomodoros: 1,
  };

  const mockCompletedTask: Task = {
    id: 'task-2',
    title: 'Completed Task',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    completedAt: new Date('2025-01-01T12:00:00Z'),
    isCompleted: true,
    estimatedPomodoros: 2,
    completedPomodoros: 2,
  };

  const mockSession: PomodoroSession = {
    id: 'session-1',
    startTime: new Date('2025-01-01T10:00:00Z'),
    endTime: new Date('2025-01-01T10:25:00Z'),
    duration: 1500,
    mode: 'work' as TimerMode,
    taskId: 'task-1',
    completed: true,
  };

  beforeEach(() => {
    mockTaskManager = new TaskManager();
    mockSessionManager = new SessionManager();
    
    // Setup default mocks
    vi.mocked(mockTaskManager.getTaskById).mockImplementation((id) => {
      if (id === 'task-1') return mockTask;
      if (id === 'task-2') return mockCompletedTask;
      return undefined;
    });
    
    vi.mocked(mockSessionManager.startSession).mockReturnValue('session-1');
    vi.mocked(mockSessionManager.completeSession).mockReturnValue(mockSession);
    vi.mocked(mockSessionManager.cancelSession).mockReturnValue(true);
    vi.mocked(mockSessionManager.getSessionsByTask).mockReturnValue([mockSession]);
    
    integration = new TaskPomodoroIntegration({
      taskManager: mockTaskManager,
      sessionManager: mockSessionManager,
    });
  });

  describe('startPomodoroSession', () => {
    it('should start session without task association', () => {
      const sessionId = integration.startPomodoroSession('work');

      expect(sessionId).toBe('session-1');
      expect(mockSessionManager.startSession).toHaveBeenCalledWith('work', undefined);
    });

    it('should start session with valid task association', () => {
      const sessionId = integration.startPomodoroSession('work', 'task-1');

      expect(sessionId).toBe('session-1');
      expect(mockSessionManager.startSession).toHaveBeenCalledWith('work', 'task-1');
      expect(mockTaskManager.getTaskById).toHaveBeenCalledWith('task-1');
    });

    it('should throw error for non-existent task', () => {
      expect(() => integration.startPomodoroSession('work', 'non-existent')).toThrow('Task with id non-existent not found');
    });

    it('should throw error for completed task', () => {
      expect(() => integration.startPomodoroSession('work', 'task-2')).toThrow('Cannot start pomodoro session for completed task');
    });

    it('should track current session and task', () => {
      integration.startPomodoroSession('work', 'task-1');

      const currentSession = integration.getCurrentSession();
      expect(currentSession).toEqual({
        sessionId: 'session-1',
        taskId: 'task-1',
      });
    });
  });

  describe('completePomodoroSession', () => {
    beforeEach(() => {
      integration.startPomodoroSession('work', 'task-1');
    });

    it('should complete session and update task statistics for work mode', () => {
      const session = integration.completePomodoroSession(true);

      expect(session).toEqual(mockSession);
      expect(mockSessionManager.completeSession).toHaveBeenCalledWith('session-1', true);
      expect(mockTaskManager.associatePomodoroWithTask).toHaveBeenCalledWith('task-1');
    });

    it('should complete session without updating task statistics for break mode', () => {
      // Start a break session
      integration.startPomodoroSession('shortBreak', 'task-1');
      
      const breakSession = { ...mockSession, mode: 'shortBreak' as TimerMode };
      vi.mocked(mockSessionManager.completeSession).mockReturnValue(breakSession);

      const session = integration.completePomodoroSession(true);

      expect(session).toEqual(breakSession);
      expect(mockTaskManager.associatePomodoroWithTask).not.toHaveBeenCalled();
    });

    it('should complete session without updating task statistics when not completed', () => {
      const session = integration.completePomodoroSession(false);

      expect(session).toEqual(mockSession);
      expect(mockTaskManager.associatePomodoroWithTask).not.toHaveBeenCalled();
    });

    it('should complete session without updating task statistics when no task associated', () => {
      // Start session without task
      integration.startPomodoroSession('work');
      
      const sessionWithoutTask = { ...mockSession, taskId: undefined };
      vi.mocked(mockSessionManager.completeSession).mockReturnValue(sessionWithoutTask);

      const session = integration.completePomodoroSession(true);

      expect(session).toEqual(sessionWithoutTask);
      expect(mockTaskManager.associatePomodoroWithTask).not.toHaveBeenCalled();
    });

    it('should handle task update errors gracefully', () => {
      vi.mocked(mockTaskManager.associatePomodoroWithTask).mockImplementation(() => {
        throw new Error('Task update failed');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const session = integration.completePomodoroSession(true);

      expect(session).toEqual(mockSession);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task pomodoro count:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should reset current session after completion', () => {
      integration.completePomodoroSession(true);

      const currentSession = integration.getCurrentSession();
      expect(currentSession).toBeNull();
    });

    it('should throw error when no active session', () => {
      const newIntegration = new TaskPomodoroIntegration({
        taskManager: mockTaskManager,
        sessionManager: mockSessionManager,
      });

      expect(() => newIntegration.completePomodoroSession()).toThrow('No active pomodoro session to complete');
    });
  });

  describe('cancelPomodoroSession', () => {
    it('should cancel active session', () => {
      integration.startPomodoroSession('work', 'task-1');

      const result = integration.cancelPomodoroSession();

      expect(result).toBe(true);
      expect(mockSessionManager.cancelSession).toHaveBeenCalledWith('session-1');
      expect(integration.getCurrentSession()).toBeNull();
    });

    it('should return false when no active session', () => {
      const result = integration.cancelPomodoroSession();

      expect(result).toBe(false);
      expect(mockSessionManager.cancelSession).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentSession', () => {
    it('should return null when no active session', () => {
      const currentSession = integration.getCurrentSession();

      expect(currentSession).toBeNull();
    });

    it('should return current session info when active', () => {
      integration.startPomodoroSession('work', 'task-1');

      const currentSession = integration.getCurrentSession();

      expect(currentSession).toEqual({
        sessionId: 'session-1',
        taskId: 'task-1',
      });
    });
  });

  describe('switchSessionTask', () => {
    beforeEach(() => {
      integration.startPomodoroSession('work', 'task-1');
    });

    it('should switch to valid task', () => {
      integration.switchSessionTask('task-1');

      const currentSession = integration.getCurrentSession();
      expect(currentSession?.taskId).toBe('task-1');
    });

    it('should switch to no task', () => {
      integration.switchSessionTask(null);

      const currentSession = integration.getCurrentSession();
      expect(currentSession?.taskId).toBeNull();
    });

    it('should throw error for non-existent task', () => {
      expect(() => integration.switchSessionTask('non-existent')).toThrow('Task with id non-existent not found');
    });

    it('should throw error for completed task', () => {
      expect(() => integration.switchSessionTask('task-2')).toThrow('Cannot associate session with completed task');
    });

    it('should throw error when no active session', () => {
      const newIntegration = new TaskPomodoroIntegration({
        taskManager: mockTaskManager,
        sessionManager: mockSessionManager,
      });

      expect(() => newIntegration.switchSessionTask('task-1')).toThrow('No active session to switch task for');
    });
  });

  describe('getTaskPomodoroHistory', () => {
    it('should return task pomodoro sessions', () => {
      const history = integration.getTaskPomodoroHistory('task-1');

      expect(history).toEqual([mockSession]);
      expect(mockSessionManager.getSessionsByTask).toHaveBeenCalledWith('task-1');
    });

    it('should throw error for non-existent task', () => {
      expect(() => integration.getTaskPomodoroHistory('non-existent')).toThrow('Task with id non-existent not found');
    });
  });

  describe('getTaskPomodoroStats', () => {
    it('should calculate task pomodoro statistics', () => {
      const stats = integration.getTaskPomodoroStats('task-1');

      expect(stats).toEqual({
        totalSessions: 1,
        completedSessions: 1,
        totalWorkTime: 1500,
        averageSessionDuration: 1500,
        completionRate: 100,
      });
    });

    it('should handle task with no sessions', () => {
      vi.mocked(mockSessionManager.getSessionsByTask).mockReturnValue([]);

      const stats = integration.getTaskPomodoroStats('task-1');

      expect(stats).toEqual({
        totalSessions: 0,
        completedSessions: 0,
        totalWorkTime: 0,
        averageSessionDuration: 0,
        completionRate: 0,
      });
    });

    it('should filter only work sessions', () => {
      const breakSession: PomodoroSession = {
        ...mockSession,
        id: 'session-2',
        mode: 'shortBreak',
      };
      vi.mocked(mockSessionManager.getSessionsByTask).mockReturnValue([mockSession, breakSession]);

      const stats = integration.getTaskPomodoroStats('task-1');

      expect(stats.totalSessions).toBe(1); // Only work session counted
    });
  });

  describe('getAllTasksPomodoroSummary', () => {
    it('should return summary for all tasks', () => {
      vi.mocked(mockTaskManager.getAllTasks).mockReturnValue([mockTask, mockCompletedTask]);

      const summary = integration.getAllTasksPomodoroSummary();

      expect(summary).toHaveLength(2);
      expect(summary[0]).toEqual({
        taskId: 'task-1',
        taskTitle: 'Test Task',
        estimatedPomodoros: 3,
        completedPomodoros: 1,
        actualSessions: 1,
        completionPercentage: expect.closeTo(33.33, 2),
      });
    });

    it('should handle tasks with zero estimated pomodoros', () => {
      const taskWithZeroEstimate = { ...mockTask, estimatedPomodoros: 0 };
      vi.mocked(mockTaskManager.getAllTasks).mockReturnValue([taskWithZeroEstimate]);

      const summary = integration.getAllTasksPomodoroSummary();

      expect(summary[0].completionPercentage).toBe(0);
    });
  });
});