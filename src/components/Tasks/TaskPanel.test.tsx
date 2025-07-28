import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskManager } from '../../core/task/TaskManager';
import { TaskStorage } from '../../core/task/TaskStorage';

// Mock the TaskStorage
vi.mock('../../core/task/TaskStorage');

describe('TaskPanel Integration', () => {
  let taskManager: TaskManager;
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = {
      getAllTasks: vi.fn().mockReturnValue([]),
      saveTasks: vi.fn(),
      clearTasks: vi.fn(),
      isStorageAvailable: vi.fn().mockReturnValue(true)
    };
    
    (TaskStorage as any).mockImplementation(() => mockStorage);
    taskManager = new TaskManager();
  });

  describe('Task Management Logic', () => {
    it('should create a new task', () => {
      const taskInput = {
        title: 'Test Task',
        description: 'Test Description',
        estimatedPomodoros: 3
      };

      const task = taskManager.createTask(taskInput);

      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.estimatedPomodoros).toBe(3);
      expect(task.completedPomodoros).toBe(0);
      expect(task.isCompleted).toBe(false);
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should get all tasks', () => {
      const task1 = taskManager.createTask({
        title: 'Task 1',
        estimatedPomodoros: 2
      });

      const task2 = taskManager.createTask({
        title: 'Task 2',
        estimatedPomodoros: 1
      });

      const allTasks = taskManager.getAllTasks();
      expect(allTasks).toHaveLength(2);
      expect(allTasks.map(t => t.title)).toContain('Task 1');
      expect(allTasks.map(t => t.title)).toContain('Task 2');
    });

    it('should get active tasks only', () => {
      const task1 = taskManager.createTask({
        title: 'Active Task',
        estimatedPomodoros: 2
      });

      const task2 = taskManager.createTask({
        title: 'Completed Task',
        estimatedPomodoros: 1
      });

      taskManager.updateTask(task2.id, { isCompleted: true });

      const activeTasks = taskManager.getActiveTasks();
      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].title).toBe('Active Task');
    });

    it('should get completed tasks only', () => {
      const task1 = taskManager.createTask({
        title: 'Active Task',
        estimatedPomodoros: 2
      });

      const task2 = taskManager.createTask({
        title: 'Completed Task',
        estimatedPomodoros: 1
      });

      taskManager.updateTask(task2.id, { isCompleted: true });

      const completedTasks = taskManager.getCompletedTasks();
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Completed Task');
      expect(completedTasks[0].isCompleted).toBe(true);
    });

    it('should update task', () => {
      const task = taskManager.createTask({
        title: 'Original Title',
        estimatedPomodoros: 2
      });

      const updatedTask = taskManager.updateTask(task.id, {
        title: 'Updated Title',
        description: 'New Description',
        estimatedPomodoros: 5
      });

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.description).toBe('New Description');
      expect(updatedTask.estimatedPomodoros).toBe(5);
    });

    it('should delete task', () => {
      const task = taskManager.createTask({
        title: 'Task to Delete',
        estimatedPomodoros: 1
      });

      const deleted = taskManager.deleteTask(task.id);
      expect(deleted).toBe(true);

      const allTasks = taskManager.getAllTasks();
      expect(allTasks).toHaveLength(0);
    });

    it('should associate pomodoro with task', () => {
      const task = taskManager.createTask({
        title: 'Task with Pomodoros',
        estimatedPomodoros: 3
      });

      taskManager.associatePomodoroWithTask(task.id);
      taskManager.associatePomodoroWithTask(task.id);

      const updatedTask = taskManager.getTaskById(task.id);
      expect(updatedTask?.completedPomodoros).toBe(2);
    });

    it('should calculate task stats correctly', () => {
      // Create some test tasks
      const task1 = taskManager.createTask({
        title: 'Task 1',
        estimatedPomodoros: 3
      });

      const task2 = taskManager.createTask({
        title: 'Task 2',
        estimatedPomodoros: 2
      });

      const task3 = taskManager.createTask({
        title: 'Task 3',
        estimatedPomodoros: 4
      });

      // Complete one task and add pomodoros
      taskManager.updateTask(task1.id, { isCompleted: true });
      taskManager.associatePomodoroWithTask(task2.id);

      const stats = taskManager.getTaskStats();

      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(1);
      expect(stats.activeTasks).toBe(2);
      expect(stats.totalEstimatedPomodoros).toBe(9);
      expect(stats.totalCompletedPomodoros).toBe(1);
      expect(stats.completionRate).toBeCloseTo(33.33, 1);
    });

    it('should handle task filtering', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const task1 = taskManager.createTask({
        title: 'Recent Task',
        description: 'Has description',
        estimatedPomodoros: 2
      });

      const task2 = taskManager.createTask({
        title: 'Old Task',
        estimatedPomodoros: 1
      });

      taskManager.updateTask(task2.id, { isCompleted: true });

      // Test completed filter
      const completedTasks = taskManager.getTasksByFilter({ isCompleted: true });
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Old Task');

      // Test active filter
      const activeTasks = taskManager.getTasksByFilter({ isCompleted: false });
      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].title).toBe('Recent Task');

      // Test description filter
      const tasksWithDescription = taskManager.getTasksByFilter({ hasDescription: true });
      expect(tasksWithDescription).toHaveLength(1);
      expect(tasksWithDescription[0].title).toBe('Recent Task');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty task title', () => {
      expect(() => {
        taskManager.createTask({
          title: '',
          estimatedPomodoros: 1
        });
      }).toThrow('Task title cannot be empty');
    });

    it('should throw error for negative estimated pomodoros', () => {
      expect(() => {
        taskManager.createTask({
          title: 'Valid Title',
          estimatedPomodoros: -1
        });
      }).toThrow('Estimated pomodoros cannot be negative');
    });

    it('should throw error when updating non-existent task', () => {
      expect(() => {
        taskManager.updateTask('non-existent-id', { title: 'New Title' });
      }).toThrow('Task with id non-existent-id not found');
    });

    it('should throw error when associating pomodoro with completed task', () => {
      const task = taskManager.createTask({
        title: 'Task',
        estimatedPomodoros: 1
      });

      taskManager.updateTask(task.id, { isCompleted: true });

      expect(() => {
        taskManager.associatePomodoroWithTask(task.id);
      }).toThrow('Cannot associate pomodoro with completed task');
    });
  });

  describe('Event System', () => {
    it('should emit events when tasks are created', () => {
      const callback = vi.fn();
      taskManager.subscribe('created', callback);

      const task = taskManager.createTask({
        title: 'New Task',
        estimatedPomodoros: 1
      });

      expect(callback).toHaveBeenCalledWith(task, 'created');
    });

    it('should emit events when tasks are updated', () => {
      const callback = vi.fn();
      taskManager.subscribe('updated', callback);

      const task = taskManager.createTask({
        title: 'Task',
        estimatedPomodoros: 1
      });

      const updatedTask = taskManager.updateTask(task.id, { title: 'Updated Task' });

      expect(callback).toHaveBeenCalledWith(updatedTask, 'updated');
    });

    it('should emit completion event when task is completed', () => {
      const callback = vi.fn();
      taskManager.subscribe('completed', callback);

      const task = taskManager.createTask({
        title: 'Task',
        estimatedPomodoros: 1
      });

      const completedTask = taskManager.updateTask(task.id, { isCompleted: true });

      expect(callback).toHaveBeenCalledWith(completedTask, 'completed');
    });

    it('should unsubscribe from events', () => {
      const callback = vi.fn();
      taskManager.subscribe('created', callback);
      taskManager.unsubscribe('created', callback);

      taskManager.createTask({
        title: 'New Task',
        estimatedPomodoros: 1
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});