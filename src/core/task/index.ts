// Task module exports
export { TaskManager } from './TaskManager';
export { TaskStorage } from './TaskStorage';
export { TaskPomodoroIntegration } from './TaskPomodoroIntegration';
export type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskFilter,
  TaskStats,
  TaskEventType,
  TaskEventCallback,
} from './types';
export type { TaskPomodoroIntegrationOptions } from './TaskPomodoroIntegration';