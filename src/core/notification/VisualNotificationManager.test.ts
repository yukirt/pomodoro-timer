import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisualNotificationManager, VisualNotification, NotificationEventHandler } from './VisualNotificationManager';

describe('VisualNotificationManager', () => {
  let manager: VisualNotificationManager;
  let mockHandler: NotificationEventHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new VisualNotificationManager();
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    manager.dispose();
  });

  describe('初始化', () => {
    it('應該使用默認配置初始化', () => {
      const config = manager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.duration).toBe(5000);
      expect(config.position).toBe('top');
      expect(config.theme).toBe('auto');
    });

    it('應該能使用自定義配置初始化', () => {
      const customManager = new VisualNotificationManager({
        enabled: false,
        duration: 3000,
        position: 'center',
        theme: 'dark'
      });

      const config = customManager.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.duration).toBe(3000);
      expect(config.position).toBe('center');
      expect(config.theme).toBe('dark');

      customManager.dispose();
    });

    it('應該初始時沒有活動通知', () => {
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });
  });

  describe('配置管理', () => {
    it('應該能更新配置', () => {
      manager.updateConfig({ duration: 8000, position: 'bottom' });
      
      const config = manager.getConfig();
      expect(config.duration).toBe(8000);
      expect(config.position).toBe('bottom');
      expect(config.enabled).toBe(true); // 保持原有值
    });

    it('應該在配置更新時觸發事件', () => {
      manager.on('configUpdate', mockHandler);
      manager.updateConfig({ theme: 'light' });
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'light' })
      );
    });

    it('應該能啟用和禁用通知', () => {
      expect(manager.isEnabled()).toBe(true);
      
      manager.setEnabled(false);
      expect(manager.isEnabled()).toBe(false);
      
      manager.setEnabled(true);
      expect(manager.isEnabled()).toBe(true);
    });
  });

  describe('通知顯示', () => {
    it('應該能顯示工作完成通知', () => {
      const id = manager.showWorkCompleteNotification();
      
      expect(id).toBeTruthy();
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      const notification = manager.getActiveNotifications()[0];
      expect(notification.type).toBe('work-complete');
      expect(notification.mode).toBe('work');
      expect(notification.title).toBe('工作時間結束！');
    });

    it('應該能顯示休息完成通知', () => {
      const id = manager.showBreakCompleteNotification();
      
      expect(id).toBeTruthy();
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      const notification = manager.getActiveNotifications()[0];
      expect(notification.type).toBe('break-complete');
      expect(notification.mode).toBe('shortBreak');
      expect(notification.title).toBe('休息時間結束！');
    });

    it('應該能顯示長休息完成通知', () => {
      const id = manager.showLongBreakCompleteNotification();
      
      expect(id).toBeTruthy();
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      const notification = manager.getActiveNotifications()[0];
      expect(notification.type).toBe('long-break-complete');
      expect(notification.mode).toBe('longBreak');
      expect(notification.title).toBe('長休息時間結束！');
    });

    it('應該能使用自定義選項顯示通知', () => {
      const customOptions = {
        title: '自定義標題',
        message: '自定義消息',
        duration: 3000
      };
      
      manager.showWorkCompleteNotification(customOptions);
      const notification = manager.getActiveNotifications()[0];
      
      expect(notification.title).toBe('自定義標題');
      expect(notification.message).toBe('自定義消息');
      expect(notification.duration).toBe(3000);
    });

    it('應該在禁用時不顯示通知', () => {
      manager.setEnabled(false);
      const id = manager.showWorkCompleteNotification();
      
      expect(id).toBeNull();
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('應該為每個通知生成唯一ID', () => {
      const id1 = manager.showWorkCompleteNotification();
      const id2 = manager.showBreakCompleteNotification();
      
      expect(id1).not.toBe(id2);
      expect(manager.getActiveNotifications()).toHaveLength(2);
    });
  });

  describe('通知隱藏', () => {
    it('應該能隱藏指定通知', () => {
      const id = manager.showWorkCompleteNotification();
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      const result = manager.hideNotification(id!);
      expect(result).toBe(true);
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('應該在隱藏不存在的通知時返回false', () => {
      const result = manager.hideNotification('non-existent-id');
      expect(result).toBe(false);
    });

    it('應該能隱藏所有通知', () => {
      manager.showWorkCompleteNotification();
      manager.showBreakCompleteNotification();
      expect(manager.getActiveNotifications()).toHaveLength(2);
      
      manager.hideAllNotifications();
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('應該在自動隱藏時間後隱藏通知', () => {
      manager.updateConfig({ duration: 1000 });
      manager.showWorkCompleteNotification();
      
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      vi.advanceTimersByTime(1000);
      
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('應該不自動隱藏持續時間為0的通知', () => {
      manager.showWorkCompleteNotification({ duration: 0 });
      
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      vi.advanceTimersByTime(10000);
      
      expect(manager.getActiveNotifications()).toHaveLength(1);
    });
  });

  describe('事件處理', () => {
    it('應該在顯示通知時觸發show事件', () => {
      manager.on('show', mockHandler);
      manager.showWorkCompleteNotification();
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'work-complete',
          mode: 'work'
        })
      );
    });

    it('應該在隱藏通知時觸發hide事件', () => {
      manager.on('hide', mockHandler);
      const id = manager.showWorkCompleteNotification();
      
      vi.clearAllMocks();
      manager.hideNotification(id!);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'work-complete',
          mode: 'work'
        })
      );
    });

    it('應該能取消訂閱事件', () => {
      manager.on('show', mockHandler);
      manager.off('show', mockHandler);
      
      manager.showWorkCompleteNotification();
      
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('應該在事件處理器出錯時繼續執行', () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();
      
      manager.on('show', errorHandler);
      manager.on('show', normalHandler);
      
      // 應該不拋出錯誤
      expect(() => manager.showWorkCompleteNotification()).not.toThrow();
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('CSS類名生成', () => {
    it('應該為工作模式生成正確的CSS類名', () => {
      const className = manager.getNotificationClass('work');
      expect(className).toContain('visual-notification');
      expect(className).toContain('visual-notification--work');
      expect(className).toContain('visual-notification--top');
      expect(className).toContain('visual-notification--auto');
    });

    it('應該為短休息模式生成正確的CSS類名', () => {
      const className = manager.getNotificationClass('shortBreak');
      expect(className).toContain('visual-notification--shortBreak');
    });

    it('應該為長休息模式生成正確的CSS類名', () => {
      const className = manager.getNotificationClass('longBreak');
      expect(className).toContain('visual-notification--longBreak');
    });

    it('應該根據配置生成不同的CSS類名', () => {
      manager.updateConfig({ position: 'center', theme: 'dark' });
      const className = manager.getNotificationClass('work');
      
      expect(className).toContain('visual-notification--center');
      expect(className).toContain('visual-notification--dark');
    });
  });

  describe('禁用時的行為', () => {
    it('應該在禁用時隱藏所有活動通知', () => {
      manager.showWorkCompleteNotification();
      manager.showBreakCompleteNotification();
      expect(manager.getActiveNotifications()).toHaveLength(2);
      
      manager.setEnabled(false);
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('應該在禁用時觸發配置更新事件', () => {
      manager.on('configUpdate', mockHandler);
      manager.setEnabled(false);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });
  });

  describe('資源清理', () => {
    it('應該在dispose時清理所有資源', () => {
      manager.on('show', mockHandler);
      manager.showWorkCompleteNotification();
      
      expect(manager.getActiveNotifications()).toHaveLength(1);
      
      manager.dispose();
      
      expect(manager.getActiveNotifications()).toHaveLength(0);
      
      // 清除之前的調用記錄
      vi.clearAllMocks();
      
      // 事件處理器應該被清理
      manager.showWorkCompleteNotification();
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('通知內容', () => {
    it('應該為不同類型的通知提供正確的默認消息', () => {
      manager.showWorkCompleteNotification();
      manager.showBreakCompleteNotification();
      manager.showLongBreakCompleteNotification();
      
      const notifications = manager.getActiveNotifications();
      
      expect(notifications[0].message).toBe('是時候休息一下了。點擊開始休息時間。');
      expect(notifications[1].message).toBe('休息結束，準備開始下一個工作週期。');
      expect(notifications[2].message).toBe('長休息結束，準備開始新的工作週期。');
    });

    it('應該為每個通知設置時間戳', () => {
      const beforeTime = new Date();
      manager.showWorkCompleteNotification();
      const afterTime = new Date();
      
      const notification = manager.getActiveNotifications()[0];
      expect(notification.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(notification.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});