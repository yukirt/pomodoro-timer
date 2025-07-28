// Task manager implementation
import { Task, TaskCreateInput, TaskUpdateInput, TaskFilter, TaskStats, TaskEventType, TaskEventCallback } from './types';
import { TaskStorage } from './TaskStorage';

export class TaskManager {
  private storage: TaskStorage;
  private tasks: Task[] = [];
  private eventCallbacks: Map<TaskEventType, TaskEventCallback[]> = new Map();

  constructor(storage?: TaskStorage) {
    this.storage = storage || new TaskStorage();
    this.initializeEventCallbacks();
    this.loadTasks();
  }

  private initializeEventCallbacks(): void {
    const eventTypes: TaskEventType[] = ['created', 'updated', 'deleted', 'completed', 'pomodoroAssociated'];
    eventTypes.forEach(eventType => {
      this.eventCallbacks.set(eventType, []);
    });
  }

  private loadTasks(): void {
    this.tasks = this.storage.getAllTasks();
  }

  private saveTasks(): void {
    this.storage.saveTasks(this.tasks);
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent(task: Task, eventType: TaskEventType): void {
    const callbacks = this.eventCallbacks.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(task, eventType);
      } catch (error) {
        console.error(`Error in task event callback for ${eventType}:`, error);
      }
    });
  }

  /**
   * 創建新任務
   */
  createTask(input: TaskCreateInput): Task {
    if (!input.title.trim()) {
      throw new Error('Task title cannot be empty');
    }

    if (input.estimatedPomodoros < 0) {
      throw new Error('Estimated pomodoros cannot be negative');
    }

    const task: Task = {
      id: this.generateId(),
      title: input.title.trim(),
      description: input.description?.trim(),
      createdAt: new Date(),
      isCompleted: false,
      estimatedPomodoros: input.estimatedPomodoros,
      completedPomodoros: 0,
    };

    this.tasks.push(task);
    this.saveTasks();
    this.emitEvent(task, 'created');

    return task;
  }

  /**
   * 獲取所有任務
   */
  getAllTasks(): Task[] {
    return [...this.tasks];
  }

  /**
   * 獲取活動任務（未完成）
   */
  getActiveTasks(): Task[] {
    return this.tasks.filter(task => !task.isCompleted);
  }

  /**
   * 獲取已完成任務
   */
  getCompletedTasks(): Task[] {
    return this.tasks.filter(task => task.isCompleted);
  }

  /**
   * 根據篩選條件獲取任務
   */
  getTasksByFilter(filter: TaskFilter): Task[] {
    return this.tasks.filter(task => {
      if (filter.isCompleted !== undefined && task.isCompleted !== filter.isCompleted) {
        return false;
      }

      if (filter.createdAfter && task.createdAt < filter.createdAfter) {
        return false;
      }

      if (filter.createdBefore && task.createdAt > filter.createdBefore) {
        return false;
      }

      if (filter.hasDescription !== undefined) {
        const hasDesc = Boolean(task.description && task.description.trim());
        if (hasDesc !== filter.hasDescription) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 根據ID獲取任務
   */
  getTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }

  /**
   * 更新任務
   */
  updateTask(id: string, updates: TaskUpdateInput): Task {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const task = this.tasks[taskIndex];
    const updatedTask: Task = {
      ...task,
      ...updates,
    };

    // 驗證更新
    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('Task title cannot be empty');
    }

    if (updates.estimatedPomodoros !== undefined && updates.estimatedPomodoros < 0) {
      throw new Error('Estimated pomodoros cannot be negative');
    }

    // 如果任務被標記為完成，設置完成時間
    if (updates.isCompleted === true && !task.isCompleted) {
      updatedTask.completedAt = new Date();
      this.emitEvent(updatedTask, 'completed');
    }

    // 如果任務被標記為未完成，清除完成時間
    if (updates.isCompleted === false && task.isCompleted) {
      updatedTask.completedAt = undefined;
    }

    this.tasks[taskIndex] = updatedTask;
    this.saveTasks();
    this.emitEvent(updatedTask, 'updated');

    return updatedTask;
  }

  /**
   * 刪除任務
   */
  deleteTask(id: string): boolean {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return false;
    }

    const task = this.tasks[taskIndex];
    this.tasks.splice(taskIndex, 1);
    this.saveTasks();
    this.emitEvent(task, 'deleted');

    return true;
  }

  /**
   * 將番茄鐘與任務關聯（增加完成的番茄鐘數量）
   */
  associatePomodoroWithTask(taskId: string): void {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    if (task.isCompleted) {
      throw new Error('Cannot associate pomodoro with completed task');
    }

    const updatedTask = {
      ...task,
      completedPomodoros: task.completedPomodoros + 1,
    };

    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    this.tasks[taskIndex] = updatedTask;
    this.saveTasks();
    this.emitEvent(updatedTask, 'pomodoroAssociated');
  }

  /**
   * 標記任務為完成
   */
  markTaskAsCompleted(id: string): Task {
    return this.updateTask(id, { isCompleted: true });
  }

  /**
   * 獲取任務統計信息
   */
  getTaskStats(): TaskStats {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(task => task.isCompleted).length;
    const activeTasks = totalTasks - completedTasks;
    const totalEstimatedPomodoros = this.tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
    const totalCompletedPomodoros = this.tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      totalEstimatedPomodoros,
      totalCompletedPomodoros,
      completionRate,
    };
  }

  /**
   * 訂閱任務事件
   */
  subscribe(eventType: TaskEventType, callback: TaskEventCallback): void {
    const callbacks = this.eventCallbacks.get(eventType) || [];
    callbacks.push(callback);
    this.eventCallbacks.set(eventType, callbacks);
  }

  /**
   * 取消訂閱任務事件
   */
  unsubscribe(eventType: TaskEventType, callback: TaskEventCallback): void {
    const callbacks = this.eventCallbacks.get(eventType) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 清除所有任務
   */
  clearAllTasks(): void {
    this.tasks = [];
    this.storage.clearTasks();
  }
}