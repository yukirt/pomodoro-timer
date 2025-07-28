import React, { useState, useEffect } from 'react';
import { TimerSettings } from '../../core/settings/types';
import settingsManager from '../../core/settings/SettingsManager';

interface SettingsPanelProps {
  onSettingsChange?: (settings: TimerSettings) => void;
  onClose?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onSettingsChange,
  onClose 
}) => {
  const [settings, setSettings] = useState<TimerSettings>(settingsManager.getSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TimerSettings, string>>>({});

  useEffect(() => {
    // Subscribe to settings changes from other sources
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      setSettings(newSettings);
      setHasChanges(false);
    });

    return unsubscribe;
  }, []);

  const validateField = (key: keyof TimerSettings, value: any): string | null => {
    switch (key) {
      case 'workDuration':
        if (value < 1 || value > 120) return '工作時間必須在 1-120 分鐘之間';
        break;
      case 'shortBreakDuration':
        if (value < 1 || value > 60) return '短休息時間必須在 1-60 分鐘之間';
        break;
      case 'longBreakDuration':
        if (value < 1 || value > 120) return '長休息時間必須在 1-120 分鐘之間';
        break;
      case 'longBreakInterval':
        if (value < 1 || value > 10) return '長休息間隔必須在 1-10 個週期之間';
        break;
    }
    return null;
  };

  const handleInputChange = (key: keyof TimerSettings, value: any) => {
    const error = validateField(key, value);
    
    setErrors(prev => ({
      ...prev,
      [key]: error
    }));

    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      // Check for any validation errors
      const hasErrors = Object.values(errors).some(error => error !== null && error !== undefined);
      if (hasErrors) {
        return;
      }

      settingsManager.updateSettings(settings);
      setHasChanges(false);
      onSettingsChange?.(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    const defaultSettings = settingsManager.resetToDefaults();
    setSettings(defaultSettings);
    setErrors({});
    setHasChanges(true);
    onSettingsChange?.(defaultSettings);
  };

  const handleCancel = () => {
    const currentSettings = settingsManager.getSettings();
    setSettings(currentSettings);
    setErrors({});
    setHasChanges(false);
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>設定</h2>
        {onClose && (
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="關閉設定"
          >
            ✕
          </button>
        )}
      </div>

      <div className="settings-content">
        {/* Time Settings Section */}
        <section className="settings-section">
          <h3>時間設定</h3>
          
          <div className="setting-group">
            <label htmlFor="work-duration">
              工作時間 (分鐘)
            </label>
            <input
              id="work-duration"
              type="number"
              min="1"
              max="120"
              value={settings.workDuration}
              onChange={(e) => handleInputChange('workDuration', parseInt(e.target.value) || 1)}
              className={errors.workDuration ? 'error' : ''}
            />
            {errors.workDuration && (
              <span className="error-message">{errors.workDuration}</span>
            )}
          </div>

          <div className="setting-group">
            <label htmlFor="short-break-duration">
              短休息時間 (分鐘)
            </label>
            <input
              id="short-break-duration"
              type="number"
              min="1"
              max="60"
              value={settings.shortBreakDuration}
              onChange={(e) => handleInputChange('shortBreakDuration', parseInt(e.target.value) || 1)}
              className={errors.shortBreakDuration ? 'error' : ''}
            />
            {errors.shortBreakDuration && (
              <span className="error-message">{errors.shortBreakDuration}</span>
            )}
          </div>

          <div className="setting-group">
            <label htmlFor="long-break-duration">
              長休息時間 (分鐘)
            </label>
            <input
              id="long-break-duration"
              type="number"
              min="1"
              max="120"
              value={settings.longBreakDuration}
              onChange={(e) => handleInputChange('longBreakDuration', parseInt(e.target.value) || 1)}
              className={errors.longBreakDuration ? 'error' : ''}
            />
            {errors.longBreakDuration && (
              <span className="error-message">{errors.longBreakDuration}</span>
            )}
          </div>

          <div className="setting-group">
            <label htmlFor="long-break-interval">
              長休息間隔 (工作週期數)
            </label>
            <input
              id="long-break-interval"
              type="number"
              min="1"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) => handleInputChange('longBreakInterval', parseInt(e.target.value) || 1)}
              className={errors.longBreakInterval ? 'error' : ''}
            />
            {errors.longBreakInterval && (
              <span className="error-message">{errors.longBreakInterval}</span>
            )}
            <small className="help-text">
              每完成多少個工作週期後進行長休息
            </small>
          </div>
        </section>

        {/* Automation Settings Section */}
        <section className="settings-section">
          <h3>自動化設定</h3>
          
          <div className="setting-group">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => handleInputChange('autoStartBreaks', e.target.checked)}
              />
              <span className="switch-slider"></span>
              自動開始休息
            </label>
            <small className="help-text">
              工作時間結束後自動開始休息時間
            </small>
          </div>

          <div className="setting-group">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.autoStartWork}
                onChange={(e) => handleInputChange('autoStartWork', e.target.checked)}
              />
              <span className="switch-slider"></span>
              自動開始工作
            </label>
            <small className="help-text">
              休息時間結束後自動開始下一個工作週期
            </small>
          </div>
        </section>

        {/* Notification Settings Section */}
        <section className="settings-section">
          <h3>通知設定</h3>
          
          <div className="setting-group">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
              />
              <span className="switch-slider"></span>
              啟用聲音提醒
            </label>
            <small className="help-text">
              時間結束時播放提示音
            </small>
          </div>

          <div className="setting-group">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
              />
              <span className="switch-slider"></span>
              啟用桌面通知
            </label>
            <small className="help-text">
              時間結束時顯示桌面通知
            </small>
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleReset}
        >
          重置為預設值
        </button>
        
        <div className="action-buttons-right">
          <button 
            className="btn btn-outline"
            onClick={handleCancel}
            disabled={!hasChanges}
          >
            取消
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || Object.values(errors).some(error => error)}
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;