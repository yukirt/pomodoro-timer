import { PomodoroSession, DailyStats, StatsFilter, StatsExportData } from './types';
import { TimerMode } from '../timer/types';

export class StatsFilterManager {
  /**
   * 根據篩選條件過濾會話數據
   */
  filterSessions(sessions: PomodoroSession[], filter: StatsFilter): PomodoroSession[] {
    let filteredSessions = [...sessions];

    // 按日期範圍篩選
    if (filter.startDate) {
      filteredSessions = filteredSessions.filter(
        session => session.startTime >= filter.startDate!
      );
    }

    if (filter.endDate) {
      filteredSessions = filteredSessions.filter(
        session => session.startTime <= filter.endDate!
      );
    }

    // 按任務ID篩選
    if (filter.taskId) {
      filteredSessions = filteredSessions.filter(
        session => session.taskId === filter.taskId
      );
    }

    // 按模式篩選
    if (filter.mode) {
      filteredSessions = filteredSessions.filter(
        session => session.mode === filter.mode
      );
    }

    // 只顯示已完成的會話
    if (filter.completedOnly) {
      filteredSessions = filteredSessions.filter(
        session => session.completed
      );
    }

    return filteredSessions;
  }

  /**
   * 根據篩選條件過濾每日統計數據
   */
  filterDailyStats(dailyStats: DailyStats[], filter: StatsFilter): DailyStats[] {
    let filteredStats = [...dailyStats];

    // 按日期範圍篩選
    if (filter.startDate) {
      const startDateStr = this.formatDate(filter.startDate);
      filteredStats = filteredStats.filter(
        stats => stats.date >= startDateStr
      );
    }

    if (filter.endDate) {
      const endDateStr = this.formatDate(filter.endDate);
      filteredStats = filteredStats.filter(
        stats => stats.date <= endDateStr
      );
    }

    // 如果有其他篩選條件，需要重新篩選每日統計中的會話
    if (filter.taskId || filter.mode || filter.completedOnly) {
      filteredStats = filteredStats.map(dayStats => {
        const filteredSessions = this.filterSessions(dayStats.sessions, filter);
        
        // 重新計算統計數據
        const completedPomodoros = filteredSessions.filter(
          session => session.completed && session.mode === 'work'
        ).length;

        const totalWorkTime = filteredSessions
          .filter(session => session.mode === 'work')
          .reduce((total, session) => total + session.duration, 0);

        const totalBreakTime = filteredSessions
          .filter(session => session.mode === 'shortBreak' || session.mode === 'longBreak')
          .reduce((total, session) => total + session.duration, 0);

        return {
          ...dayStats,
          completedPomodoros,
          totalWorkTime,
          totalBreakTime,
          sessions: filteredSessions
        };
      });
    }

    return filteredStats;
  }

  /**
   * 按週篩選數據
   */
  filterByWeek(sessions: PomodoroSession[], weekStartDate: Date): PomodoroSession[] {
    const weekStart = this.getWeekStart(weekStartDate);
    const weekEnd = this.getWeekEnd(weekStart);

    return this.filterSessions(sessions, {
      startDate: weekStart,
      endDate: weekEnd
    });
  }

  /**
   * 按月篩選數據
   */
  filterByMonth(sessions: PomodoroSession[], year: number, month: number): PomodoroSession[] {
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    return this.filterSessions(sessions, {
      startDate,
      endDate
    });
  }

  /**
   * 按年篩選數據
   */
  filterByYear(sessions: PomodoroSession[], year: number): PomodoroSession[] {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    return this.filterSessions(sessions, {
      startDate,
      endDate
    });
  }

  /**
   * 獲取最近N天的數據
   */
  filterByRecentDays(sessions: PomodoroSession[], days: number): PomodoroSession[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    return this.filterSessions(sessions, {
      startDate,
      endDate
    });
  }

  /**
   * 按工作日/週末篩選
   */
  filterByWeekdayType(sessions: PomodoroSession[], type: 'weekday' | 'weekend'): PomodoroSession[] {
    return sessions.filter(session => {
      const dayOfWeek = session.startTime.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
      
      return type === 'weekend' ? isWeekend : !isWeekend;
    });
  }

  /**
   * 按時間段篩選（小時）
   */
  filterByTimeRange(sessions: PomodoroSession[], startHour: number, endHour: number): PomodoroSession[] {
    return sessions.filter(session => {
      const hour = session.startTime.getHours();
      return hour >= startHour && hour <= endHour;
    });
  }

  /**
   * 導出統計數據
   */
  exportStats(
    sessions: PomodoroSession[], 
    dailyStats: DailyStats[], 
    format: 'json' | 'csv' = 'json'
  ): StatsExportData | string {
    const exportData: StatsExportData = {
      sessions,
      dailyStats,
      exportDate: new Date(),
      totalSessions: sessions.length,
      totalWorkTime: sessions
        .filter(s => s.mode === 'work')
        .reduce((total, s) => total + s.duration, 0)
    };

    if (format === 'json') {
      return exportData;
    } else {
      return this.convertToCSV(exportData);
    }
  }

  /**
   * 導出會話數據為CSV格式
   */
  exportSessionsToCSV(sessions: PomodoroSession[]): string {
    const headers = [
      'ID',
      'Start Time',
      'End Time',
      'Duration (seconds)',
      'Mode',
      'Completed',
      'Task ID'
    ];

    const rows = sessions.map(session => [
      session.id,
      session.startTime.toISOString(),
      session.endTime.toISOString(),
      session.duration.toString(),
      session.mode,
      session.completed.toString(),
      session.taskId || ''
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  /**
   * 導出每日統計為CSV格式
   */
  exportDailyStatsToCSV(dailyStats: DailyStats[]): string {
    const headers = [
      'Date',
      'Completed Pomodoros',
      'Total Work Time (seconds)',
      'Total Break Time (seconds)',
      'Total Sessions'
    ];

    const rows = dailyStats.map(stats => [
      stats.date,
      stats.completedPomodoros.toString(),
      stats.totalWorkTime.toString(),
      stats.totalBreakTime.toString(),
      stats.sessions.length.toString()
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  /**
   * 創建預設篩選器
   */
  createPresetFilters(): { [key: string]: StatsFilter } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const thisWeekStart = this.getWeekStart(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      today: {
        startDate: today,
        endDate: now
      },
      yesterday: {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      },
      thisWeek: {
        startDate: thisWeekStart,
        endDate: now
      },
      lastWeek: {
        startDate: lastWeekStart,
        endDate: lastWeekEnd
      },
      thisMonth: {
        startDate: thisMonthStart,
        endDate: now
      },
      lastMonth: {
        startDate: lastMonthStart,
        endDate: lastMonthEnd
      },
      last7Days: {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      last30Days: {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      workOnly: {
        mode: 'work' as TimerMode,
        completedOnly: true
      },
      breakOnly: {
        mode: 'shortBreak' as TimerMode
      }
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整為週一開始
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  private convertToCSV(data: StatsExportData): string {
    const sections = [];
    
    // Export metadata
    sections.push('Export Information');
    sections.push(`Export Date,${data.exportDate.toISOString()}`);
    sections.push(`Total Sessions,${data.totalSessions}`);
    sections.push(`Total Work Time (seconds),${data.totalWorkTime}`);
    sections.push('');

    // Export sessions
    sections.push('Sessions');
    sections.push(this.exportSessionsToCSV(data.sessions));
    sections.push('');

    // Export daily stats
    sections.push('Daily Statistics');
    sections.push(this.exportDailyStatsToCSV(data.dailyStats));

    return sections.join('\n');
  }

  private arrayToCSV(data: string[][]): string {
    return data.map(row => 
      row.map(cell => 
        // Escape cells that contain commas, quotes, or newlines
        /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(',')
    ).join('\n');
  }
}