// Integration between Task Management and Pomodoro Sessions
import { TaskManager } from './TaskManager';
import { SessionManager } from '../stats/SessionManager';
import { PomodoroSession } from '../stats/types';
import { TimerMode } from '../timer/types';

export interface TaskPomodoroIntegrationOptions {
  taskManager: TaskManager;
  sessionManager: SessionManager;
}

export class TaskPomodoroIntegration {
  private taskManager: TaskManager;
  private sessionManager: SessionManager;
  private currentSessionId: string | null = null;
  private currentTaskId: string | null = null;

  constructor(options: TaskPomodoroIntegrationOptions) {
    this.taskManager = options.taskManager;
    this.sessionManager = options.sessionManager;
  }

  /**
   * 開始與任務關聯的番茄鐘會話
   */
  startPomodoroSession(mode: TimerMode, taskId?: string): string {
    // 驗證任務存在且未完成
    if (taskId) {
      const task = this.taskManager.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task with id ${taskId} not found`);
      }
      if (task.isCompleted) {
        throw new Error('Cannot start pomodoro session for completed task');
      }
    }

    // 開始新的會話
    const sessionId = this.sessionManager.startSession(mode, taskId);
    this.currentSessionId = sessionId;
    this.currentTaskId = taskId || null;

    return sessionId;
  }

  /**
   * 完成當前番茄鐘會話並更新任務統計
   */
  completePomodoroSession(completed: boolean = true): PomodoroSession | null {
    if (!this.currentSessionId) {
      throw new Error('No active pomodoro session to complete');
    }

    // 完成會話
    const session = this.sessionManager.completeSession(this.currentSessionId, completed);
    
    if (session && completed && session.mode === 'work' && this.currentTaskId) {
      try {
        // 只有在工作模式且成功完成時才更新任務統計
        this.taskManager.associatePomodoroWithTask(this.currentTaskId);
      } catch (error) {
        console.error('Failed to update task pomodoro count:', error);
        // 不拋出錯誤，因為會話已經完成
      }
    }

    // 重置當前會話信息
    this.currentSessionId = null;
    this.currentTaskId = null;

    return session;
  }

  /**
   * 取消當前番茄鐘會話
   */
  cancelPomodoroSession(): boolean {
    if (!this.currentSessionId) {
      return false;
    }

    const cancelled = this.sessionManager.cancelSession(this.currentSessionId);
    
    if (cancelled) {
      this.currentSessionId = null;
      this.currentTaskId = null;
    }

    return cancelled;
  }

  /**
   * 獲取當前活動會話信息
   */
  getCurrentSession(): { sessionId: string; taskId: string | null } | null {
    if (!this.currentSessionId) {
      return null;
    }

    return {
      sessionId: this.currentSessionId,
      taskId: this.currentTaskId,
    };
  }

  /**
   * 切換當前會話的關聯任務
   */
  switchSessionTask(taskId: string | null): void {
    if (!this.currentSessionId) {
      throw new Error('No active session to switch task for');
    }

    // 驗證新任務（如果提供）
    if (taskId) {
      const task = this.taskManager.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task with id ${taskId} not found`);
      }
      if (task.isCompleted) {
        throw new Error('Cannot associate session with completed task');
      }
    }

    this.currentTaskId = taskId;
    
    // 更新會話中的任務ID（需要修改SessionManager以支持此功能）
    // 這裡我們暫時只更新本地狀態，實際實現可能需要SessionManager的額外方法
  }

  /**
   * 獲取任務的番茄鐘會話歷史
   */
  getTaskPomodoroHistory(taskId: string): PomodoroSession[] {
    const task = this.taskManager.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    return this.sessionManager.getSessionsByTask(taskId);
  }

  /**
   * 獲取任務的番茄鐘統計
   */
  getTaskPomodoroStats(taskId: string): {
    totalSessions: number;
    completedSessions: number;
    totalWorkTime: number;
    averageSessionDuration: number;
    completionRate: number;
  } {
    const sessions = this.getTaskPomodoroHistory(taskId);
    const workSessions = sessions.filter(s => s.mode === 'work');
    const completedWorkSessions = workSessions.filter(s => s.completed);
    
    const totalWorkTime = completedWorkSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionDuration = completedWorkSessions.length > 0 
      ? totalWorkTime / completedWorkSessions.length 
      : 0;
    const completionRate = workSessions.length > 0 
      ? (completedWorkSessions.length / workSessions.length) * 100 
      : 0;

    return {
      totalSessions: workSessions.length,
      completedSessions: completedWorkSessions.length,
      totalWorkTime,
      averageSessionDuration,
      completionRate,
    };
  }

  /**
   * 批量更新歷史會話的任務關聯
   */
  updateHistoricalTaskAssociations(sessionId: string, taskId: string | null): boolean {
    // 這個功能需要SessionManager支持更新現有會話
    // 目前作為佔位符實現
    console.warn('updateHistoricalTaskAssociations not fully implemented - requires SessionManager enhancement');
    return false;
  }

  /**
   * 獲取所有任務的番茄鐘完成情況摘要
   */
  getAllTasksPomodoroSummary(): Array<{
    taskId: string;
    taskTitle: string;
    estimatedPomodoros: number;
    completedPomodoros: number;
    actualSessions: number;
    completionPercentage: number;
  }> {
    const tasks = this.taskManager.getAllTasks();
    
    return tasks.map(task => {
      const stats = this.getTaskPomodoroStats(task.id);
      const completionPercentage = task.estimatedPomodoros > 0 
        ? (task.completedPomodoros / task.estimatedPomodoros) * 100 
        : 0;

      return {
        taskId: task.id,
        taskTitle: task.title,
        estimatedPomodoros: task.estimatedPomodoros,
        completedPomodoros: task.completedPomodoros,
        actualSessions: stats.completedSessions,
        completionPercentage,
      };
    });
  }
}