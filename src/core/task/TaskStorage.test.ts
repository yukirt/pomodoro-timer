// TaskStorage unit tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskStorage } from './TaskStorage';
import { Task } from './types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('TaskStorage', () => {
  let taskStorage: TaskStorage;
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: 'Test description',
      createdAt: new Date('2025-01-01T10:00:00Z'),
      isCompleted: false,
      estimatedPomodoros: 3,
      completedPomodoros: 1,
    },
    {
      id: 'task-2',
      title: 'Test Task 2',
      createdAt: new Date('2025-01-02T10:00:00Z'),
      completedAt: new Date('2025-01-02T12:00:00Z'),
      isCompleted: true,
      estimatedPomodoros: 2,
      completedPomodoros: 2,
    },
  ];

  beforeEach(() => {
    taskStorage = new TaskStorage();
    vi.clearAllMocks();
  });

  describe('getAllTasks', () => {
    it('should return empty array when no tasks stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const tasks = taskStorage.getAllTasks();

      expect(tasks).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('pomodoro_tasks');
    });

    it('should return tasks with dates properly converted', () => {
      const tasksJson = JSON.stringify(mockTasks);
      localStorageMock.getItem.mockReturnValue(tasksJson);

      const tasks = taskStorage.getAllTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].createdAt).toBeInstanceOf(Date);
      expect(tasks[1].completedAt).toBeInstanceOf(Date);
      expect(tasks[0].title).toBe('Test Task 1');
      expect(tasks[1].title).toBe('Test Task 2');
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const tasks = taskStorage.getAllTasks();

      expect(tasks).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading tasks from storage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveTasks', () => {
    it('should save tasks to localStorage', () => {
      taskStorage.saveTasks(mockTasks);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro_tasks',
        JSON.stringify(mockTasks)
      );
    });

    it('should throw error when localStorage fails', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => taskStorage.saveTasks(mockTasks)).toThrow('Failed to save tasks');
      expect(consoleSpy).toHaveBeenCalledWith('Error saving tasks to storage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearTasks', () => {
    it('should remove tasks from localStorage', () => {
      taskStorage.clearTasks();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pomodoro_tasks');
    });

    it('should throw error when localStorage fails', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => taskStorage.clearTasks()).toThrow('Failed to clear tasks');
      expect(consoleSpy).toHaveBeenCalledWith('Error clearing tasks from storage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      // Reset mocks to not throw errors
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {});
      
      const result = taskStorage.isStorageAvailable();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test_storage', 'test');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_storage');
    });

    it('should return false when localStorage is not available', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = taskStorage.isStorageAvailable();

      expect(result).toBe(false);
    });
  });
});