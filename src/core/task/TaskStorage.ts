// Task storage implementation using localStorage
import { Task } from './types';

export class TaskStorage {
  private readonly STORAGE_KEY = 'pomodoro_tasks';

  /**
   * 獲取所有任務
   */
  getAllTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem(this.STORAGE_KEY);
      if (!tasksJson) {
        return [];
      }

      const tasks = JSON.parse(tasksJson);
      // 將日期字符串轉換回 Date 對象
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error loading tasks from storage:', error);
      return [];
    }
  }

  /**
   * 保存所有任務
   */
  saveTasks(tasks: Task[]): void {
    try {
      const tasksJson = JSON.stringify(tasks);
      localStorage.setItem(this.STORAGE_KEY, tasksJson);
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
      throw new Error('Failed to save tasks');
    }
  }

  /**
   * 清除所有任務數據
   */
  clearTasks(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing tasks from storage:', error);
      throw new Error('Failed to clear tasks');
    }
  }

  /**
   * 檢查存儲是否可用
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = 'test_storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}