import { TimerMode } from '../timer/types';

export interface VisualNotificationConfig {
  enabled: boolean;
  duration: number; // Duration in milliseconds
  position: 'top' | 'center' | 'bottom';
  theme: 'auto' | 'light' | 'dark';
}

export interface VisualNotification {
  id: string;
  type: 'work-complete' | 'break-complete' | 'long-break-complete';
  title: string;
  message: string;
  mode: TimerMode;
  timestamp: Date;
  duration?: number;
}

export type NotificationEventHandler = (notification: VisualNotification) => void;

export class VisualNotificationManager {
  private config: VisualNotificationConfig;
  private activeNotifications: Map<string, VisualNotification> = new Map();
  private eventHandlers: Map<string, NotificationEventHandler[]> = new Map();
  private notificationCounter = 0;

  constructor(config?: Partial<VisualNotificationConfig>) {
    this.config = {
      enabled: true,
      duration: 5000, // 5 seconds default
      position: 'top',
      theme: 'auto',
      ...config
    };
  }

  /**
   * Show a visual notification
   */
  showNotification(
    type: VisualNotification['type'],
    mode: TimerMode,
    options?: {
      title?: string;
      message?: string;
      duration?: number;
    }
  ): string | null {
    if (!this.config.enabled) {
      return null;
    }

    const id = `notification-${++this.notificationCounter}`;
    const notification: VisualNotification = {
      id,
      type,
      mode,
      timestamp: new Date(),
      title: options?.title || this.getDefaultTitle(type, mode),
      message: options?.message || this.getDefaultMessage(type, mode),
      duration: options?.duration !== undefined ? options.duration : this.config.duration
    };

    this.activeNotifications.set(id, notification);
    this.emit('show', notification);

    // Auto-hide after duration (only if duration is greater than 0)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.hideNotification(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * Hide a specific notification
   */
  hideNotification(id: string): boolean {
    const notification = this.activeNotifications.get(id);
    if (!notification) {
      return false;
    }

    this.activeNotifications.delete(id);
    this.emit('hide', notification);
    return true;
  }

  /**
   * Hide all active notifications
   */
  hideAllNotifications(): void {
    const notifications = Array.from(this.activeNotifications.values());
    this.activeNotifications.clear();
    
    notifications.forEach(notification => {
      this.emit('hide', notification);
    });
  }

  /**
   * Get all active notifications
   */
  getActiveNotifications(): VisualNotification[] {
    return Array.from(this.activeNotifications.values());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VisualNotificationConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdate', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualNotificationConfig {
    return { ...this.config };
  }

  /**
   * Subscribe to notification events
   */
  on(event: 'show' | 'hide' | 'configUpdate', handler: NotificationEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Unsubscribe from notification events
   */
  off(event: 'show' | 'hide' | 'configUpdate', handler: NotificationEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Show work completion notification
   */
  showWorkCompleteNotification(options?: { title?: string; message?: string; duration?: number }): string | null {
    return this.showNotification('work-complete', 'work', options);
  }

  /**
   * Show break completion notification
   */
  showBreakCompleteNotification(options?: { title?: string; message?: string; duration?: number }): string | null {
    return this.showNotification('break-complete', 'shortBreak', options);
  }

  /**
   * Show long break completion notification
   */
  showLongBreakCompleteNotification(options?: { title?: string; message?: string; duration?: number }): string | null {
    return this.showNotification('long-break-complete', 'longBreak', options);
  }

  /**
   * Enable or disable visual notifications
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.hideAllNotifications();
    }
    this.emit('configUpdate', this.config);
  }

  /**
   * Check if visual notifications are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get CSS class for notification styling based on mode
   */
  getNotificationClass(mode: TimerMode): string {
    const baseClass = 'visual-notification';
    const modeClass = `${baseClass}--${mode}`;
    const positionClass = `${baseClass}--${this.config.position}`;
    const themeClass = `${baseClass}--${this.config.theme}`;
    
    return `${baseClass} ${modeClass} ${positionClass} ${themeClass}`;
  }

  private getDefaultTitle(type: VisualNotification['type'], mode: TimerMode): string {
    switch (type) {
      case 'work-complete':
        return '工作時間結束！';
      case 'break-complete':
        return '休息時間結束！';
      case 'long-break-complete':
        return '長休息時間結束！';
      default:
        return '番茄鐘提醒';
    }
  }

  private getDefaultMessage(type: VisualNotification['type'], mode: TimerMode): string {
    switch (type) {
      case 'work-complete':
        return '是時候休息一下了。點擊開始休息時間。';
      case 'break-complete':
        return '休息結束，準備開始下一個工作週期。';
      case 'long-break-complete':
        return '長休息結束，準備開始新的工作週期。';
      default:
        return '番茄鐘計時器提醒';
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.warn(`Error in notification event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.hideAllNotifications();
    this.eventHandlers.clear();
    this.activeNotifications.clear();
  }
}