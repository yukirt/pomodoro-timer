import { PomodoroSession, DailyStats, WeeklyStats } from './types';
import { TimerMode } from '../timer/types';

export class StatsCalculator {
  /**
   * 計算指定日期的統計數據
   */
  calculateDailyStats(sessions: PomodoroSession[], date: Date): DailyStats {
    const dateStr = this.formatDate(date);
    const daySessions = sessions.filter(session => {
      const sessionDate = this.formatDate(session.startTime);
      return sessionDate === dateStr;
    });

    const completedPomodoros = daySessions.filter(
      session => session.completed && session.mode === 'work'
    ).length;

    const totalWorkTime = daySessions
      .filter(session => session.mode === 'work')
      .reduce((total, session) => total + session.duration, 0);

    const totalBreakTime = daySessions
      .filter(session => session.mode === 'shortBreak' || session.mode === 'longBreak')
      .reduce((total, session) => total + session.duration, 0);

    return {
      date: dateStr,
      completedPomodoros,
      totalWorkTime,
      totalBreakTime,
      sessions: daySessions
    };
  }

  /**
   * 計算指定週的統計數據
   */
  calculateWeeklyStats(sessions: PomodoroSession[], weekStartDate: Date): WeeklyStats {
    const weekStart = this.getWeekStart(weekStartDate);
    const weekEnd = this.getWeekEnd(weekStart);
    
    const weekSessions = sessions.filter(session => {
      const sessionDate = session.startTime;
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    const dailyStats: DailyStats[] = [];
    const currentDate = new Date(weekStart);
    
    // 生成一週的每日統計
    for (let i = 0; i < 7; i++) {
      const dayStats = this.calculateDailyStats(sessions, currentDate);
      dailyStats.push(dayStats);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalPomodoros = dailyStats.reduce(
      (total, day) => total + day.completedPomodoros, 0
    );

    const totalWorkTime = dailyStats.reduce(
      (total, day) => total + day.totalWorkTime, 0
    );

    const totalBreakTime = dailyStats.reduce(
      (total, day) => total + day.totalBreakTime, 0
    );

    return {
      weekStart: this.formatDate(weekStart),
      weekEnd: this.formatDate(weekEnd),
      totalPomodoros,
      totalWorkTime,
      totalBreakTime,
      dailyStats
    };
  }

  /**
   * 計算指定日期範圍的統計數據
   */
  calculateRangeStats(sessions: PomodoroSession[], startDate: Date, endDate: Date): {
    totalPomodoros: number;
    totalWorkTime: number;
    totalBreakTime: number;
    averageDailyPomodoros: number;
    averageDailyWorkTime: number;
    dailyStats: DailyStats[];
  } {
    const rangeSessions = sessions.filter(session => {
      const sessionDate = session.startTime;
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const dailyStats: DailyStats[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStats = this.calculateDailyStats(sessions, currentDate);
      dailyStats.push(dayStats);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalPomodoros = dailyStats.reduce(
      (total, day) => total + day.completedPomodoros, 0
    );

    const totalWorkTime = dailyStats.reduce(
      (total, day) => total + day.totalWorkTime, 0
    );

    const totalBreakTime = dailyStats.reduce(
      (total, day) => total + day.totalBreakTime, 0
    );

    const dayCount = dailyStats.length;
    const averageDailyPomodoros = dayCount > 0 ? totalPomodoros / dayCount : 0;
    const averageDailyWorkTime = dayCount > 0 ? totalWorkTime / dayCount : 0;

    return {
      totalPomodoros,
      totalWorkTime,
      totalBreakTime,
      averageDailyPomodoros,
      averageDailyWorkTime,
      dailyStats
    };
  }

  /**
   * 計算任務相關統計
   */
  calculateTaskStats(sessions: PomodoroSession[], taskId: string): {
    totalPomodoros: number;
    totalWorkTime: number;
    completedPomodoros: number;
    averageSessionDuration: number;
    sessions: PomodoroSession[];
  } {
    const taskSessions = sessions.filter(session => session.taskId === taskId);
    const workSessions = taskSessions.filter(session => session.mode === 'work');
    
    const totalPomodoros = workSessions.length;
    const completedPomodoros = workSessions.filter(session => session.completed).length;
    const totalWorkTime = workSessions.reduce((total, session) => total + session.duration, 0);
    const averageSessionDuration = totalPomodoros > 0 ? totalWorkTime / totalPomodoros : 0;

    return {
      totalPomodoros,
      totalWorkTime,
      completedPomodoros,
      averageSessionDuration,
      sessions: taskSessions
    };
  }

  /**
   * 計算生產力趨勢
   */
  calculateProductivityTrend(
    sessions: PomodoroSession[], 
    days: number = 7, 
    endDate?: Date
  ): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
    dailyAverages: number[];
  } {
    const actualEndDate = endDate || new Date();
    const startDate = new Date(actualEndDate);
    startDate.setDate(actualEndDate.getDate() - days + 1);

    const rangeStats = this.calculateRangeStats(sessions, startDate, actualEndDate);
    const dailyPomodoros = rangeStats.dailyStats.map(day => day.completedPomodoros);
    
    if (dailyPomodoros.length < 2) {
      return {
        trend: 'stable',
        changePercentage: 0,
        dailyAverages: dailyPomodoros
      };
    }

    // 計算前半段和後半段的平均值
    const midPoint = Math.floor(dailyPomodoros.length / 2);
    const firstHalf = dailyPomodoros.slice(0, midPoint);
    const secondHalf = dailyPomodoros.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    let changePercentage = 0;
    if (firstHalfAvg > 0) {
      changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    } else if (secondHalfAvg > 0) {
      changePercentage = 100; // From 0 to something is 100% increase
    }

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changePercentage) < 10) { // Lowered threshold for more sensitivity
      trend = 'stable';
    } else if (changePercentage > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      changePercentage: Math.round(changePercentage * 100) / 100,
      dailyAverages: dailyPomodoros
    };
  }

  /**
   * 獲取最佳工作時段分析
   */
  calculateBestWorkingHours(sessions: PomodoroSession[]): {
    hourlyStats: { hour: number; completedPomodoros: number; averageDuration: number }[];
    bestHour: number;
    worstHour: number;
  } {
    const workSessions = sessions.filter(
      session => session.mode === 'work' && session.completed
    );

    const hourlyData: { [hour: number]: { count: number; totalDuration: number } } = {};

    // 初始化24小時數據
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, totalDuration: 0 };
    }

    // 統計每小時的數據
    workSessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourlyData[hour].count++;
      hourlyData[hour].totalDuration += session.duration;
    });

    // 轉換為統計格式
    const hourlyStats = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      completedPomodoros: data.count,
      averageDuration: data.count > 0 ? data.totalDuration / data.count : 0
    }));

    // 找出最佳和最差時段
    const sortedByCount = [...hourlyStats].sort((a, b) => b.completedPomodoros - a.completedPomodoros);
    const bestHour = sortedByCount[0].hour;
    const worstHour = sortedByCount[sortedByCount.length - 1].hour;

    return {
      hourlyStats,
      bestHour,
      worstHour
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整為週一開始
    return new Date(d.setDate(diff));
  }

  private getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }
}