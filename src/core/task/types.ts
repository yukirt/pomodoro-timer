// Task management types and interfaces

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  estimatedPomodoros: number;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  estimatedPomodoros?: number;
  isCompleted?: boolean;
}

export interface TaskFilter {
  isCompleted?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  hasDescription?: boolean;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  totalEstimatedPomodoros: number;
  totalCompletedPomodoros: number;
  completionRate: number; // percentage
}

export type TaskEventType = 'created' | 'updated' | 'deleted' | 'completed' | 'pomodoroAssociated';

export interface TaskEventCallback {
  (task: Task, eventType: TaskEventType): void;
}