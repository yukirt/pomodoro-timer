// TaskManager unit tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskManager } from './TaskManager';
import { TaskStorage } from './TaskStorage';
import { Task, TaskCreateInput, TaskUpdateInput, TaskFilter } from './types';

// Mock TaskStorage
vi.mock('./TaskStorage');

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let mockStorage: TaskStorage;
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
    mockStorage = new TaskStorage();
    vi.mocked(mockStorage.getAllTasks).mockReturnValue([...mockTasks]);
    vi.mocked(mockStorage.saveTasks).mockImplementation(() => {});
    vi.mocked(mockStorage.clearTasks).mockImplementation(() => {});
    
    taskManager = new TaskManager(mockStorage);
  });

  describe('createTask', () => {
    it('should create a new task with valid input', () => {
      const input: TaskCreateInput = {
        title: 'New Task',
        description: 'New description',
        estimatedPomodoros: 4,
      };

      const task = taskManager.createTask(input);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('New Task');
      expect(task.description).toBe('New description');
      expect(task.estimatedPomodoros).toBe(4);
      expect(task.completedPomodoros).toBe(0);
      expect(task.isCompleted).toBe(false);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(mockStorage.saveTasks).toHaveBeenCalled();
    });

    it('should trim whitespace from title and description', () => {
      const input: TaskCreateInput = {
        title: '  Trimmed Task  ',
        description: '  Trimmed description  ',
        estimatedPomodoros: 2,
      };

      const task = taskManager.createTask(input);

      expect(task.title).toBe('Trimmed Task');
      expect(task.description).toBe('Trimmed description');
    });

    it('should throw error for empty title', () => {
      const input: TaskCreateInput = {
        title: '   ',
        estimatedPomodoros: 1,
      };

      expect(() => taskManager.createTask(input)).toThrow('Task title cannot be empty');
    });

    it('should throw error for negative estimated pomodoros', () => {
      const input: TaskCreateInput = {
        title: 'Valid Task',
        estimatedPomodoros: -1,
      };

      expect(() => taskManager.createTask(input)).toThrow('Estimated pomodoros cannot be negative');
    });

    it('should emit created event', () => {
      const callback = vi.fn();
      taskManager.subscribe('created', callback);

      const input: TaskCreateInput = {
        title: 'Event Test Task',
        estimatedPomodoros: 1,
      };

      const task = taskManager.createTask(input);

      expect(callback).toHaveBeenCalledWith(task, 'created');
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks', () => {
      const tasks = taskManager.getAllTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Test Task 1');
      expect(tasks[1].title).toBe('Test Task 2');
    });

    it('should return a copy of tasks array', () => {
      const tasks1 = taskManager.getAllTasks();
      const tasks2 = taskManager.getAllTasks();

      expect(tasks1).not.toBe(tasks2);
      expect(tasks1).toEqual(tasks2);
    });
  });

  describe('getActiveTasks', () => {
    it('should return only incomplete tasks', () => {
      const activeTasks = taskManager.getActiveTasks();

      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].id).toBe('task-1');
      expect(activeTasks[0].isCompleted).toBe(false);
    });
  });

  describe('getCompletedTasks', () => {
    it('should return only completed tasks', () => {
      const completedTasks = taskManager.getCompletedTasks();

      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].id).toBe('task-2');
      expect(completedTasks[0].isCompleted).toBe(true);
    });
  });

  describe('getTasksByFilter', () => {
    it('should filter by completion status', () => {
      const filter: TaskFilter = { isCompleted: false };
      const tasks = taskManager.getTasksByFilter(filter);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].isCompleted).toBe(false);
    });

    it('should filter by creation date range', () => {
      const filter: TaskFilter = {
        createdAfter: new Date('2025-01-01T12:00:00Z'),
      };
      const tasks = taskManager.getTasksByFilter(filter);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-2');
    });

    it('should filter by description presence', () => {
      const filter: TaskFilter = { hasDescription: true };
      const tasks = taskManager.getTasksByFilter(filter);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-1');
    });
  });

  describe('getTaskById', () => {
    it('should return task with matching id', () => {
      const task = taskManager.getTaskById('task-1');

      expect(task).toBeDefined();
      expect(task!.id).toBe('task-1');
    });

    it('should return undefined for non-existent id', () => {
      const task = taskManager.getTaskById('non-existent');

      expect(task).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should update task with valid input', () => {
      const updates: TaskUpdateInput = {
        title: 'Updated Task',
        description: 'Updated description',
        estimatedPomodoros: 5,
      };

      const updatedTask = taskManager.updateTask('task-1', updates);

      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.description).toBe('Updated description');
      expect(updatedTask.estimatedPomodoros).toBe(5);
      expect(mockStorage.saveTasks).toHaveBeenCalled();
    });

    it('should set completion date when marking as completed', () => {
      const updates: TaskUpdateInput = { isCompleted: true };

      const updatedTask = taskManager.updateTask('task-1', updates);

      expect(updatedTask.isCompleted).toBe(true);
      expect(updatedTask.completedAt).toBeInstanceOf(Date);
    });

    it('should clear completion date when marking as incomplete', () => {
      const updates: TaskUpdateInput = { isCompleted: false };

      const updatedTask = taskManager.updateTask('task-2', updates);

      expect(updatedTask.isCompleted).toBe(false);
      expect(updatedTask.completedAt).toBeUndefined();
    });

    it('should throw error for non-existent task', () => {
      const updates: TaskUpdateInput = { title: 'Updated' };

      expect(() => taskManager.updateTask('non-existent', updates)).toThrow('Task with id non-existent not found');
    });

    it('should throw error for empty title', () => {
      const updates: TaskUpdateInput = { title: '   ' };

      expect(() => taskManager.updateTask('task-1', updates)).toThrow('Task title cannot be empty');
    });

    it('should emit completed event when task is completed', () => {
      const callback = vi.fn();
      taskManager.subscribe('completed', callback);

      const updates: TaskUpdateInput = { isCompleted: true };
      const updatedTask = taskManager.updateTask('task-1', updates);

      expect(callback).toHaveBeenCalledWith(updatedTask, 'completed');
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', () => {
      const result = taskManager.deleteTask('task-1');

      expect(result).toBe(true);
      expect(taskManager.getTaskById('task-1')).toBeUndefined();
      expect(mockStorage.saveTasks).toHaveBeenCalled();
    });

    it('should return false for non-existent task', () => {
      const result = taskManager.deleteTask('non-existent');

      expect(result).toBe(false);
    });

    it('should emit deleted event', () => {
      const callback = vi.fn();
      taskManager.subscribe('deleted', callback);

      const taskToDelete = taskManager.getTaskById('task-1')!;
      taskManager.deleteTask('task-1');

      expect(callback).toHaveBeenCalledWith(taskToDelete, 'deleted');
    });
  });

  describe('associatePomodoroWithTask', () => {
    it('should increment completed pomodoros for existing task', () => {
      taskManager.associatePomodoroWithTask('task-1');

      const task = taskManager.getTaskById('task-1')!;
      expect(task.completedPomodoros).toBe(2);
      expect(mockStorage.saveTasks).toHaveBeenCalled();
    });

    it('should throw error for non-existent task', () => {
      expect(() => taskManager.associatePomodoroWithTask('non-existent')).toThrow('Task with id non-existent not found');
    });

    it('should throw error for completed task', () => {
      expect(() => taskManager.associatePomodoroWithTask('task-2')).toThrow('Cannot associate pomodoro with completed task');
    });

    it('should emit pomodoroAssociated event', () => {
      const callback = vi.fn();
      taskManager.subscribe('pomodoroAssociated', callback);

      taskManager.associatePomodoroWithTask('task-1');

      expect(callback).toHaveBeenCalledWith(expect.any(Object), 'pomodoroAssociated');
    });
  });

  describe('markTaskAsCompleted', () => {
    it('should mark task as completed', () => {
      const completedTask = taskManager.markTaskAsCompleted('task-1');

      expect(completedTask.isCompleted).toBe(true);
      expect(completedTask.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('getTaskStats', () => {
    it('should return correct task statistics', () => {
      const stats = taskManager.getTaskStats();

      expect(stats.totalTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.activeTasks).toBe(1);
      expect(stats.totalEstimatedPomodoros).toBe(5);
      expect(stats.totalCompletedPomodoros).toBe(3);
      expect(stats.completionRate).toBe(50);
    });

    it('should handle empty task list', () => {
      vi.mocked(mockStorage.getAllTasks).mockReturnValue([]);
      const emptyTaskManager = new TaskManager(mockStorage);

      const stats = emptyTaskManager.getTaskStats();

      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.activeTasks).toBe(0);
      expect(stats.totalEstimatedPomodoros).toBe(0);
      expect(stats.totalCompletedPomodoros).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('event subscription', () => {
    it('should allow subscribing and unsubscribing to events', () => {
      const callback = vi.fn();

      taskManager.subscribe('created', callback);
      taskManager.createTask({ title: 'Test', estimatedPomodoros: 1 });
      expect(callback).toHaveBeenCalledTimes(1);

      taskManager.unsubscribe('created', callback);
      taskManager.createTask({ title: 'Test 2', estimatedPomodoros: 1 });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      taskManager.subscribe('created', errorCallback);
      taskManager.createTask({ title: 'Test', estimatedPomodoros: 1 });

      expect(consoleSpy).toHaveBeenCalledWith('Error in task event callback for created:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearAllTasks', () => {
    it('should clear all tasks', () => {
      taskManager.clearAllTasks();

      expect(taskManager.getAllTasks()).toHaveLength(0);
      expect(mockStorage.clearTasks).toHaveBeenCalled();
    });
  });
});