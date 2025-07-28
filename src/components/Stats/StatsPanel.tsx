import React, { useState, useEffect, useMemo } from 'react';
import { DailyStats, WeeklyStats, PomodoroSession, StatsFilter } from '../../core/stats/types';
import { StatsCalculator } from '../../core/stats/StatsCalculator';
import { SessionManager } from '../../core/stats/SessionManager';

interface StatsPanelProps {
  onClose?: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ onClose }) => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [selectedView, setSelectedView] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filter, setFilter] = useState<StatsFilter>({});
  
  const statsCalculator = useMemo(() => new StatsCalculator(), []);
  const sessionManager = useMemo(() => new SessionManager(), []);

  useEffect(() => {
    // Load sessions on component mount
    const loadedSessions = sessionManager.getAllSessions();
    setSessions(loadedSessions);
  }, [sessionManager]);

  // Calculate stats based on selected view
  const currentStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedView) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1); // Monday
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return null;
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return null;
    }

    return statsCalculator.calculateRangeStats(sessions, startDate, endDate);
  }, [sessions, selectedView, customStartDate, customEndDate, statsCalculator]);

  // Calculate today's stats for overview
  const todayStats = useMemo(() => {
    const today = new Date();
    return statsCalculator.calculateDailyStats(sessions, today);
  }, [sessions, statsCalculator]);

  // Calculate productivity trend
  const productivityTrend = useMemo(() => {
    return statsCalculator.calculateProductivityTrend(sessions, 7);
  }, [sessions, statsCalculator]);

  // Calculate best working hours
  const workingHoursAnalysis = useMemo(() => {
    return statsCalculator.calculateBestWorkingHours(sessions);
  }, [sessions, statsCalculator]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小時 ${minutes}分鐘`;
    }
    return `${minutes}分鐘`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getTrendText = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '上升';
      case 'decreasing': return '下降';
      default: return '穩定';
    }
  };

  const exportData = () => {
    const exportData = {
      sessions,
      exportDate: new Date(),
      totalSessions: sessions.length,
      totalWorkTime: sessions
        .filter(s => s.mode === 'work')
        .reduce((total, s) => total + s.duration, 0)
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomodoro-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2>統計數據</h2>
        {onClose && (
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="關閉統計"
          >
            ✕
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🍅</div>
          <div className="stat-content">
            <div className="stat-value">{todayStats.completedPomodoros}</div>
            <div className="stat-label">今日完成</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{formatTime(todayStats.totalWorkTime)}</div>
            <div className="stat-label">今日工作時間</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">{getTrendIcon(productivityTrend.trend)}</div>
          <div className="stat-content">
            <div className="stat-value">
              {Math.abs(productivityTrend.changePercentage).toFixed(1)}%
            </div>
            <div className="stat-label">
              7日趨勢 ({getTrendText(productivityTrend.trend)})
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{workingHoursAnalysis.bestHour}:00</div>
            <div className="stat-label">最佳工作時段</div>
          </div>
        </div>
      </div>

      {/* View Selection */}
      <div className="stats-controls">
        <div className="view-selector">
          <button
            className={`view-button ${selectedView === 'today' ? 'active' : ''}`}
            onClick={() => setSelectedView('today')}
          >
            今日
          </button>
          <button
            className={`view-button ${selectedView === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedView('week')}
          >
            本週
          </button>
          <button
            className={`view-button ${selectedView === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedView('month')}
          >
            本月
          </button>
          <button
            className={`view-button ${selectedView === 'custom' ? 'active' : ''}`}
            onClick={() => setSelectedView('custom')}
          >
            自訂範圍
          </button>
        </div>

        {selectedView === 'custom' && (
          <div className="custom-date-range">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              placeholder="開始日期"
            />
            <span>至</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              placeholder="結束日期"
            />
          </div>
        )}

        <button className="export-button" onClick={exportData}>
          📊 匯出數據
        </button>
      </div>

      {/* Detailed Stats */}
      {currentStats && (
        <div className="stats-details">
          <div className="stats-summary">
            <h3>
              {selectedView === 'today' && '今日統計'}
              {selectedView === 'week' && '本週統計'}
              {selectedView === 'month' && '本月統計'}
              {selectedView === 'custom' && '自訂範圍統計'}
            </h3>
            
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">完成番茄鐘</span>
                <span className="summary-value">{currentStats.totalPomodoros}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">總工作時間</span>
                <span className="summary-value">{formatTime(currentStats.totalWorkTime)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">總休息時間</span>
                <span className="summary-value">{formatTime(currentStats.totalBreakTime)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">日均番茄鐘</span>
                <span className="summary-value">{currentStats.averageDailyPomodoros.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Daily Chart */}
          <div className="daily-chart">
            <h4>每日完成情況</h4>
            <div className="chart-container">
              {currentStats.dailyStats.map((day, index) => (
                <div key={day.date} className="chart-bar-container">
                  <div 
                    className="chart-bar"
                    style={{
                      height: `${Math.max(4, (day.completedPomodoros / Math.max(...currentStats.dailyStats.map(d => d.completedPomodoros), 1)) * 100)}px`
                    }}
                    title={`${formatDate(day.date)}: ${day.completedPomodoros} 個番茄鐘`}
                  ></div>
                  <div className="chart-label">
                    {formatDate(day.date)}
                  </div>
                  <div className="chart-value">
                    {day.completedPomodoros}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Working Hours Heatmap */}
          <div className="working-hours-analysis">
            <h4>工作時段分析</h4>
            <div className="hours-grid">
              {workingHoursAnalysis.hourlyStats.map((hourStat) => (
                <div
                  key={hourStat.hour}
                  className="hour-cell"
                  style={{
                    backgroundColor: `rgba(76, 175, 80, ${Math.min(hourStat.completedPomodoros / 5, 1)})`
                  }}
                  title={`${hourStat.hour}:00 - ${hourStat.completedPomodoros} 個番茄鐘`}
                >
                  <div className="hour-label">{hourStat.hour}</div>
                  <div className="hour-count">{hourStat.completedPomodoros}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!currentStats && selectedView === 'custom' && (
        <div className="no-data">
          <p>請選擇日期範圍以查看統計數據</p>
        </div>
      )}

      {currentStats && currentStats.totalPomodoros === 0 && (
        <div className="no-data">
          <p>所選時間範圍內沒有完成的番茄鐘</p>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;