import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsPanel from './SettingsPanel';
import settingsManager from '../../core/settings/SettingsManager';

// Mock the settings manager
vi.mock('../../core/settings/SettingsManager', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    resetToDefaults: vi.fn(),
    subscribe: vi.fn()
  }
}));

describe('SettingsPanel', () => {
  const mockSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notificationsEnabled: true
  };

  const mockOnSettingsChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (settingsManager.getSettings as any).mockReturnValue(mockSettings);
    (settingsManager.subscribe as any).mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render settings panel with title', () => {
      render(<SettingsPanel />);
      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('should render close button when onClose prop is provided', () => {
      render(<SettingsPanel onClose={mockOnClose} />);
      expect(screen.getByLabelText('關閉設定')).toBeInTheDocument();
    });

    it('should not render close button when onClose prop is not provided', () => {
      render(<SettingsPanel />);
      expect(screen.queryByLabelText('關閉設定')).not.toBeInTheDocument();
    });

    it('should render all settings sections', () => {
      render(<SettingsPanel />);
      expect(screen.getByText('時間設定')).toBeInTheDocument();
      expect(screen.getByText('自動化設定')).toBeInTheDocument();
      expect(screen.getByText('通知設定')).toBeInTheDocument();
    });
  });

  describe('Time Settings', () => {
    it('should render work duration input with correct value', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)') as HTMLInputElement;
      expect(input.value).toBe('25');
    });

    it('should render short break duration input with correct value', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('短休息時間 (分鐘)') as HTMLInputElement;
      expect(input.value).toBe('5');
    });

    it('should render long break duration input with correct value', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('長休息時間 (分鐘)') as HTMLInputElement;
      expect(input.value).toBe('15');
    });

    it('should render long break interval input with correct value', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('長休息間隔 (工作週期數)') as HTMLInputElement;
      expect(input.value).toBe('4');
    });

    it('should update work duration when input changes', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '30' } });
      expect((input as HTMLInputElement).value).toBe('30');
    });

    it('should show error for invalid work duration', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '150' } });
      expect(screen.getByText('工作時間必須在 1-120 分鐘之間')).toBeInTheDocument();
    });

    it('should show error for invalid short break duration', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('短休息時間 (分鐘)');
      fireEvent.change(input, { target: { value: '70' } });
      expect(screen.getByText('短休息時間必須在 1-60 分鐘之間')).toBeInTheDocument();
    });

    it('should show error for invalid long break duration', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('長休息時間 (分鐘)');
      fireEvent.change(input, { target: { value: '150' } });
      expect(screen.getByText('長休息時間必須在 1-120 分鐘之間')).toBeInTheDocument();
    });

    it('should show error for invalid long break interval', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('長休息間隔 (工作週期數)');
      fireEvent.change(input, { target: { value: '15' } });
      expect(screen.getByText('長休息間隔必須在 1-10 個週期之間')).toBeInTheDocument();
    });
  });

  describe('Automation Settings', () => {
    it('should render auto start breaks toggle with correct state', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /自動開始休息/ });
      expect(checkbox).not.toBeChecked();
    });

    it('should render auto start work toggle with correct state', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /自動開始工作/ });
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle auto start breaks when clicked', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /自動開始休息/ });
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should toggle auto start work when clicked', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /自動開始工作/ });
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Notification Settings', () => {
    it('should render sound enabled toggle with correct state', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /啟用聲音提醒/ });
      expect(checkbox).toBeChecked();
    });

    it('should render notifications enabled toggle with correct state', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /啟用桌面通知/ });
      expect(checkbox).toBeChecked();
    });

    it('should toggle sound enabled when clicked', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /啟用聲音提醒/ });
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle notifications enabled when clicked', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByRole('checkbox', { name: /啟用桌面通知/ });
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      render(<SettingsPanel />);
      expect(screen.getByText('重置為預設值')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('儲存')).toBeInTheDocument();
    });

    it('should disable save and cancel buttons when no changes', () => {
      render(<SettingsPanel />);
      expect(screen.getByText('取消')).toBeDisabled();
      expect(screen.getByText('儲存')).toBeDisabled();
    });

    it('should enable save and cancel buttons when changes are made', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '30' } });
      
      expect(screen.getByText('取消')).not.toBeDisabled();
      expect(screen.getByText('儲存')).not.toBeDisabled();
    });

    it('should disable save button when there are validation errors', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '150' } });
      
      expect(screen.getByText('儲存')).toBeDisabled();
    });

    it('should call settingsManager.updateSettings when save is clicked', () => {
      render(<SettingsPanel onSettingsChange={mockOnSettingsChange} />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '30' } });
      
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);
      
      expect(settingsManager.updateSettings).toHaveBeenCalledWith({
        ...mockSettings,
        workDuration: 30
      });
    });

    it('should call onSettingsChange when save is clicked', () => {
      render(<SettingsPanel onSettingsChange={mockOnSettingsChange} />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '30' } });
      
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...mockSettings,
        workDuration: 30
      });
    });

    it('should reset settings when reset button is clicked', () => {
      const resetSettings = { ...mockSettings, workDuration: 25 };
      (settingsManager.resetToDefaults as any).mockReturnValue(resetSettings);
      
      render(<SettingsPanel onSettingsChange={mockOnSettingsChange} />);
      const resetButton = screen.getByText('重置為預設值');
      fireEvent.click(resetButton);
      
      expect(settingsManager.resetToDefaults).toHaveBeenCalled();
      expect(mockOnSettingsChange).toHaveBeenCalledWith(resetSettings);
    });

    it('should cancel changes when cancel button is clicked', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '30' } });
      
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      
      expect((input as HTMLInputElement).value).toBe('25');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button is clicked', () => {
      render(<SettingsPanel onClose={mockOnClose} />);
      const closeButton = screen.getByLabelText('關閉設定');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Settings Subscription', () => {
    it('should subscribe to settings changes on mount', () => {
      render(<SettingsPanel />);
      expect(settingsManager.subscribe).toHaveBeenCalled();
    });

    it('should update settings when external changes occur', async () => {
      let settingsChangeCallback: any;
      (settingsManager.subscribe as any).mockImplementation((callback: any) => {
        settingsChangeCallback = callback;
        return () => {};
      });

      render(<SettingsPanel />);
      
      const newSettings = { ...mockSettings, workDuration: 35 };
      settingsChangeCallback(newSettings);

      await waitFor(() => {
        const input = screen.getByLabelText('工作時間 (分鐘)') as HTMLInputElement;
        expect(input.value).toBe('35');
      });
    });
  });

  describe('Validation', () => {
    it('should show error styling for invalid inputs', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '150' } });
      expect(input).toHaveClass('error');
    });

    it('should remove error styling when input becomes valid', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '150' } });
      expect(input).toHaveClass('error');
      
      fireEvent.change(input, { target: { value: '30' } });
      expect(input).not.toHaveClass('error');
    });
  });

  describe('Help Text', () => {
    it('should display help text for relevant settings', () => {
      render(<SettingsPanel />);
      expect(screen.getByText('每完成多少個工作週期後進行長休息')).toBeInTheDocument();
      expect(screen.getByText('工作時間結束後自動開始休息時間')).toBeInTheDocument();
      expect(screen.getByText('休息時間結束後自動開始下一個工作週期')).toBeInTheDocument();
      expect(screen.getByText('時間結束時播放提示音')).toBeInTheDocument();
      expect(screen.getByText('時間結束時顯示桌面通知')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input values gracefully', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '' } });
      expect((input as HTMLInputElement).value).toBe('1');
    });

    it('should handle non-numeric input values', () => {
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: 'abc' } });
      expect((input as HTMLInputElement).value).toBe('1');
    });

    it('should handle settings manager errors gracefully', () => {
      (settingsManager.updateSettings as any).mockImplementation(() => {
        throw new Error('Save failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SettingsPanel />);
      const input = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(input, { target: { value: '30' } });
      
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});