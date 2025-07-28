import { TimerMode } from '../timer/types';

export interface DesktopNotificationConfig {
  enabled: boolean;
  requireInteraction: boolean; // Whether notification should remain active until user interacts
  silent: boolean; // Whether notification should be silent
  icon?: string; // Path to notification icon
}

export interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string; // Unique identifier for the notification
  requireInteraction?: boolean;
  silent?: boolean;
}

export type PermissionStatus = 'granted' | 'denied' | 'default';

export class DesktopNotificationManager {
  private config: DesktopNotificationConfig;
  private activeNotifications: Map<string, Notification> = new Map();

  constructor(config?: Partial<DesktopNotificationConfig>) {
    this.config = {
      enabled: true,
      requireInteraction: false,
      silent: false,
      icon: '/favicon.ico',
      ...config
    };
  }

  /**
   * Check if the browser supports desktop notifications
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): PermissionStatus {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission as PermissionStatus;
  }

  /**
   * Request permission for desktop notifications
   */
  async requestPermission(): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      return 'denied';
    }

    if (this.getPermissionStatus() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as PermissionStatus;
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are available (supported and permitted)
   */
  isAvailable(): boolean {
    return this.isSupported() && this.getPermissionStatus() === 'granted' && this.config.enabled;
  }

  /**
   * Show a desktop notification
   */
  async showNotification(options: DesktopNotificationOptions): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || this.config.icon,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? this.config.requireInteraction,
        silent: options.silent ?? this.config.silent,
        timestamp: Date.now()
      };

      const notification = new Notification(options.title, notificationOptions);
      const id = options.tag || `notification-${Date.now()}`;
      
      this.activeNotifications.set(id, notification);

      // Clean up when notification is closed
      notification.onclose = () => {
        this.activeNotifications.delete(id);
      };

      // Clean up on error
      notification.onerror = () => {
        this.activeNotifications.delete(id);
      };

      return id;
    } catch (error) {
      console.warn('Failed to show desktop notification:', error);
      return null;
    }
  }

  /**
   * Show work completion notification
   */
  async showWorkCompleteNotification(options?: {
    customTitle?: string;
    customBody?: string;
    requireInteraction?: boolean;
  }): Promise<string | null> {
    return this.showNotification({
      title: options?.customTitle || '工作時間結束！',
      body: options?.customBody || '是時候休息一下了。點擊開始休息時間。',
      tag: 'work-complete',
      requireInteraction: options?.requireInteraction,
      icon: this.getIconForMode('work')
    });
  }

  /**
   * Show break completion notification
   */
  async showBreakCompleteNotification(options?: {
    customTitle?: string;
    customBody?: string;
    requireInteraction?: boolean;
  }): Promise<string | null> {
    return this.showNotification({
      title: options?.customTitle || '休息時間結束！',
      body: options?.customBody || '休息結束，準備開始下一個工作週期。',
      tag: 'break-complete',
      requireInteraction: options?.requireInteraction,
      icon: this.getIconForMode('shortBreak')
    });
  }

  /**
   * Show long break completion notification
   */
  async showLongBreakCompleteNotification(options?: {
    customTitle?: string;
    customBody?: string;
    requireInteraction?: boolean;
  }): Promise<string | null> {
    return this.showNotification({
      title: options?.customTitle || '長休息時間結束！',
      body: options?.customBody || '長休息結束，準備開始新的工作週期。',
      tag: 'long-break-complete',
      requireInteraction: options?.requireInteraction,
      icon: this.getIconForMode('longBreak')
    });
  }

  /**
   * Close a specific notification
   */
  closeNotification(id: string): boolean {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Close all active notifications
   */
  closeAllNotifications(): void {
    this.activeNotifications.forEach((notification, id) => {
      notification.close();
    });
    this.activeNotifications.clear();
  }

  /**
   * Get all active notification IDs
   */
  getActiveNotificationIds(): string[] {
    return Array.from(this.activeNotifications.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DesktopNotificationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If disabled, close all active notifications
    if (!this.config.enabled) {
      this.closeAllNotifications();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DesktopNotificationConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable desktop notifications
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.closeAllNotifications();
    }
  }

  /**
   * Check if desktop notifications are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set up click handler for a notification
   */
  setNotificationClickHandler(id: string, handler: () => void): boolean {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.onclick = handler;
      return true;
    }
    return false;
  }

  /**
   * Get appropriate icon for timer mode
   */
  private getIconForMode(mode: TimerMode): string {
    // You can customize icons based on mode
    switch (mode) {
      case 'work':
        return '/favicon-work.ico';
      case 'shortBreak':
        return '/favicon-break.ico';
      case 'longBreak':
        return '/favicon-long-break.ico';
      default:
        return this.config.icon || '/favicon.ico';
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.closeAllNotifications();
  }
}