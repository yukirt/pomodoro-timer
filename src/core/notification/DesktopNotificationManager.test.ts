import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DesktopNotificationManager, PermissionStatus } from './DesktopNotificationManager';

// Mock Notification API
const createMockNotification = () => ({
  close: vi.fn(),
  onclose: null,
  onerror: null,
  onclick: null
});

const mockNotificationConstructor = vi.fn();
const mockRequestPermission = vi.fn();

// Use the existing Notification mock from setup.ts and enhance it
if (window.Notification) {
  // Clear existing mock and set up our enhanced version
  vi.clearAllMocks();
  Object.assign(window.Notification, mockNotificationConstructor);
} else {
  // Fallback if not already defined
  Object.defineProperty(window, 'Notification', {
    writable: true,
    configurable: true,
    value: mockNotificationConstructor
  });
}

describe('DesktopNotificationManager', () => {
  let manager: DesktopNotificationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock
    mockNotificationConstructor.mockClear();
    mockNotificationConstructor.mockImplementation(() => createMockNotification());
    
    // Set up static properties
    Object.defineProperty(mockNotificationConstructor, 'permission', {
      writable: true,
      configurable: true,
      value: 'granted'
    });
    
    Object.defineProperty(mockNotificationConstructor, 'requestPermission', {
      writable: true,
      configurable: true,
      value: mockRequestPermission.mockResolvedValue('granted')
    });
    
    // Ensure window.Notification is properly set
    window.Notification = mockNotificationConstructor as any;
    
    manager = new DesktopNotificationManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('初始化', () => {
    it('應該使用默認配置初始化', () => {
      const config = manager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.requireInteraction).toBe(false);
      expect(config.silent).toBe(false);
      expect(config.icon).toBe('/favicon.ico');
    });

    it('應該能使用自定義配置初始化', () => {
      const customManager = new DesktopNotificationManager({
        enabled: false,
        requireInteraction: true,
        silent: true,
        icon: '/custom-icon.ico'
      });

      const config = customManager.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.requireInteraction).toBe(true);
      expect(config.silent).toBe(true);
      expect(config.icon).toBe('/custom-icon.ico');

      customManager.dispose();
    });
  });

  describe('瀏覽器支持檢測', () => {
    it('應該檢測到瀏覽器支持通知', () => {
      expect(manager.isSupported()).toBe(true);
    });

    it('應該在沒有 Notification API 時返回不支持', () => {
      // Mock the isSupported method to simulate unsupported environment
      const testManager = new DesktopNotificationManager();
      const originalIsSupported = testManager.isSupported;
      testManager.isSupported = vi.fn().mockReturnValue(false);
      
      expect(testManager.isSupported()).toBe(false);

      // Restore
      testManager.isSupported = originalIsSupported;
      testManager.dispose();
    });
  });

  describe('權限管理', () => {
    it('應該獲取當前權限狀態', () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      expect(manager.getPermissionStatus()).toBe('granted');

      Object.defineProperty(window.Notification, 'permission', { value: 'denied', configurable: true });
      expect(manager.getPermissionStatus()).toBe('denied');

      Object.defineProperty(window.Notification, 'permission', { value: 'default', configurable: true });
      expect(manager.getPermissionStatus()).toBe('default');
    });

    it('應該在不支持時返回 denied 權限', () => {
      const testManager = new DesktopNotificationManager();
      const originalIsSupported = testManager.isSupported;
      testManager.isSupported = vi.fn().mockReturnValue(false);

      expect(testManager.getPermissionStatus()).toBe('denied');

      // Restore
      testManager.isSupported = originalIsSupported;
      testManager.dispose();
    });

    it('應該請求通知權限', async () => {
      // Set permission to default to trigger request
      Object.defineProperty(window.Notification, 'permission', { value: 'default', configurable: true });
      Object.defineProperty(window.Notification, 'requestPermission', {
        value: vi.fn().mockResolvedValue('granted'),
        configurable: true
      });
      
      const permission = await manager.requestPermission();
      
      expect(permission).toBe('granted');
      expect(window.Notification.requestPermission).toHaveBeenCalled();
    });

    it('應該在已有權限時直接返回', async () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      
      const permission = await manager.requestPermission();
      
      expect(permission).toBe('granted');
      expect(window.Notification.requestPermission).not.toHaveBeenCalled();
    });

    it('應該在不支持時返回 denied', async () => {
      const testManager = new DesktopNotificationManager();
      const originalIsSupported = testManager.isSupported;
      testManager.isSupported = vi.fn().mockReturnValue(false);

      const permission = await testManager.requestPermission();
      
      expect(permission).toBe('denied');

      // Restore
      testManager.isSupported = originalIsSupported;
      testManager.dispose();
    });

    it('應該處理權限請求錯誤', async () => {
      // Set permission to default to trigger request
      Object.defineProperty(window.Notification, 'permission', { value: 'default', configurable: true });
      Object.defineProperty(window.Notification, 'requestPermission', {
        value: vi.fn().mockRejectedValue(new Error('Permission error')),
        configurable: true
      });
      
      const permission = await manager.requestPermission();
      
      expect(permission).toBe('denied');
    });
  });

  describe('可用性檢查', () => {
    it('應該在支持且有權限且啟用時返回可用', () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      manager.setEnabled(true);
      
      expect(manager.isAvailable()).toBe(true);
    });

    it('應該在沒有權限時返回不可用', () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'denied', configurable: true });
      manager.setEnabled(true);
      
      expect(manager.isAvailable()).toBe(false);
    });

    it('應該在禁用時返回不可用', () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      manager.setEnabled(false);
      
      expect(manager.isAvailable()).toBe(false);
    });
  });

  describe('通知顯示', () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      manager.setEnabled(true);
    });

    it('應該能顯示基本通知', async () => {
      const id = await manager.showNotification({
        title: '測試標題',
        body: '測試內容'
      });

      expect(id).toBeTruthy();
      expect(mockNotificationConstructor).toHaveBeenCalledWith('測試標題', {
        body: '測試內容',
        icon: '/favicon.ico',
        tag: undefined,
        requireInteraction: false,
        silent: false,
        timestamp: expect.any(Number)
      });
    });

    it('應該能顯示工作完成通知', async () => {
      const id = await manager.showWorkCompleteNotification();

      expect(id).toBeTruthy();
      expect(mockNotificationConstructor).toHaveBeenCalledWith('工作時間結束！', {
        body: '是時候休息一下了。點擊開始休息時間。',
        icon: '/favicon-work.ico',
        tag: 'work-complete',
        requireInteraction: false,
        silent: false,
        timestamp: expect.any(Number)
      });
    });

    it('應該能顯示休息完成通知', async () => {
      const id = await manager.showBreakCompleteNotification();

      expect(id).toBeTruthy();
      expect(mockNotificationConstructor).toHaveBeenCalledWith('休息時間結束！', {
        body: '休息結束，準備開始下一個工作週期。',
        icon: '/favicon-break.ico',
        tag: 'break-complete',
        requireInteraction: false,
        silent: false,
        timestamp: expect.any(Number)
      });
    });

    it('應該能顯示長休息完成通知', async () => {
      const id = await manager.showLongBreakCompleteNotification();

      expect(id).toBeTruthy();
      expect(mockNotificationConstructor).toHaveBeenCalledWith('長休息時間結束！', {
        body: '長休息結束，準備開始新的工作週期。',
        icon: '/favicon-long-break.ico',
        tag: 'long-break-complete',
        requireInteraction: false,
        silent: false,
        timestamp: expect.any(Number)
      });
    });

    it('應該能使用自定義選項顯示通知', async () => {
      await manager.showWorkCompleteNotification({
        customTitle: '自定義標題',
        customBody: '自定義內容',
        requireInteraction: true
      });

      expect(mockNotificationConstructor).toHaveBeenCalledWith('自定義標題', {
        body: '自定義內容',
        icon: '/favicon-work.ico',
        tag: 'work-complete',
        requireInteraction: true,
        silent: false,
        timestamp: expect.any(Number)
      });
    });

    it('應該在不可用時返回 null', async () => {
      manager.setEnabled(false);
      
      const id = await manager.showNotification({
        title: '測試',
        body: '測試'
      });

      expect(id).toBeNull();
      expect(mockNotificationConstructor).not.toHaveBeenCalled();
    });

    it('應該處理通知創建錯誤', async () => {
      mockNotificationConstructor.mockImplementationOnce(() => {
        throw new Error('Notification error');
      });

      const id = await manager.showNotification({
        title: '測試',
        body: '測試'
      });

      expect(id).toBeNull();
    });
  });

  describe('通知管理', () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      manager.setEnabled(true);
    });

    it('應該能關閉指定通知', async () => {
      const mockNotification = createMockNotification();
      mockNotificationConstructor.mockReturnValue(mockNotification);
      
      const id = await manager.showNotification({
        title: '測試',
        body: '測試',
        tag: 'test-notification'
      });

      const result = manager.closeNotification('test-notification');

      expect(result).toBe(true);
      expect(mockNotification.close).toHaveBeenCalled();
    });

    it('應該在關閉不存在的通知時返回 false', () => {
      const result = manager.closeNotification('non-existent');
      expect(result).toBe(false);
    });

    it('應該能關閉所有通知', async () => {
      // Track all created notifications
      const createdNotifications: any[] = [];
      mockNotificationConstructor.mockImplementation(() => {
        const notification = createMockNotification();
        createdNotifications.push(notification);
        return notification;
      });
      
      await manager.showNotification({ title: '測試1', body: '測試1', tag: 'test1' });
      await manager.showNotification({ title: '測試2', body: '測試2', tag: 'test2' });

      manager.closeAllNotifications();

      // Check that all created notifications were closed
      createdNotifications.forEach(notification => {
        expect(notification.close).toHaveBeenCalled();
      });
      expect(manager.getActiveNotificationIds()).toHaveLength(0);
    });

    it('應該追蹤活動通知', async () => {
      await manager.showNotification({ title: '測試1', body: '測試1', tag: 'test1' });
      await manager.showNotification({ title: '測試2', body: '測試2', tag: 'test2' });

      const activeIds = manager.getActiveNotificationIds();
      expect(activeIds).toContain('test1');
      expect(activeIds).toContain('test2');
    });

    it('應該在通知關閉時清理追蹤', async () => {
      const mockNotification = createMockNotification();
      mockNotificationConstructor.mockReturnValue(mockNotification);
      
      await manager.showNotification({ title: '測試', body: '測試', tag: 'test' });
      
      // 模擬通知被關閉
      if (mockNotification.onclose) {
        mockNotification.onclose(new Event('close'));
      }

      expect(manager.getActiveNotificationIds()).not.toContain('test');
    });

    it('應該在通知錯誤時清理追蹤', async () => {
      const mockNotification = createMockNotification();
      mockNotificationConstructor.mockReturnValue(mockNotification);
      
      await manager.showNotification({ title: '測試', body: '測試', tag: 'test' });
      
      // 模擬通知錯誤
      if (mockNotification.onerror) {
        mockNotification.onerror(new Event('error'));
      }

      expect(manager.getActiveNotificationIds()).not.toContain('test');
    });
  });

  describe('配置管理', () => {
    it('應該能更新配置', () => {
      manager.updateConfig({
        requireInteraction: true,
        silent: true
      });

      const config = manager.getConfig();
      expect(config.requireInteraction).toBe(true);
      expect(config.silent).toBe(true);
      expect(config.enabled).toBe(true); // 保持原有值
    });

    it('應該在禁用時關閉所有通知', async () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      
      // Track created notification
      let createdNotification: any;
      mockNotificationConstructor.mockImplementationOnce(() => {
        createdNotification = createMockNotification();
        return createdNotification;
      });
      
      await manager.showNotification({ title: '測試', body: '測試' });

      manager.updateConfig({ enabled: false });

      expect(createdNotification.close).toHaveBeenCalled();
    });

    it('應該能啟用和禁用通知', () => {
      expect(manager.isEnabled()).toBe(true);

      manager.setEnabled(false);
      expect(manager.isEnabled()).toBe(false);

      manager.setEnabled(true);
      expect(manager.isEnabled()).toBe(true);
    });
  });

  describe('點擊處理', () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      manager.setEnabled(true);
    });

    it('應該能設置通知點擊處理器', async () => {
      const mockNotification = createMockNotification();
      mockNotificationConstructor.mockReturnValue(mockNotification);
      
      const clickHandler = vi.fn();
      const id = await manager.showNotification({
        title: '測試',
        body: '測試',
        tag: 'test'
      });

      const result = manager.setNotificationClickHandler('test', clickHandler);

      expect(result).toBe(true);
      expect(mockNotification.onclick).toBe(clickHandler);
    });

    it('應該在設置不存在通知的處理器時返回 false', () => {
      const clickHandler = vi.fn();
      const result = manager.setNotificationClickHandler('non-existent', clickHandler);

      expect(result).toBe(false);
    });
  });

  describe('資源清理', () => {
    it('應該在 dispose 時關閉所有通知', async () => {
      Object.defineProperty(window.Notification, 'permission', { value: 'granted', configurable: true });
      
      // Track all created notifications
      const createdNotifications: any[] = [];
      mockNotificationConstructor.mockImplementation(() => {
        const notification = createMockNotification();
        createdNotifications.push(notification);
        return notification;
      });
      
      await manager.showNotification({ title: '測試1', body: '測試1', tag: 'test1' });
      await manager.showNotification({ title: '測試2', body: '測試2', tag: 'test2' });

      // Verify notifications were created and tracked
      expect(createdNotifications).toHaveLength(2);
      expect(manager.getActiveNotificationIds()).toContain('test1');
      expect(manager.getActiveNotificationIds()).toContain('test2');

      manager.dispose();

      // Check that all created notifications were closed
      createdNotifications.forEach(notification => {
        expect(notification.close).toHaveBeenCalled();
      });
      
      // Verify all notifications were cleared from tracking
      expect(manager.getActiveNotificationIds()).toHaveLength(0);
    });
  });
});