import { describe, it, expect, beforeEach } from 'vitest';
import { StatsCalculator } from './StatsCalculator';
import { PomodoroSession } from './types';

describe('StatsCalculator', () => {
  let calculator: StatsCalculator;
  let mockSessions: PomodoroSession[];

  beforeEach(() => {
    calculator = new StatsCalculator();
    
    // Create mock sessions for testing
    mockSessions = [
      // Day 1 (2025-01-01) - 3 work sessions, 2 completed
      {
        id: 'session-1',
        startTime: new Date('2025-01-01T09:00:00Z'),
        endTime: new Date('2025-01-01T09:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-1'
      },
      {
        id: 'session-2',
        startTime: new Date('2025-01-01T09:30:00Z'),
        endTime: new Date('2025-01-01T09:35:00Z'),
        duration: 300,
        mode: 'shortBreak',
        completed: true
      },
      {
        id: 'session-3',
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T10:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-1'
      },
      {
        id: 'session-4',
        startTime: new Date('2025-01-01T14:00:00Z'),
        endTime: new Date('2025-01-01T14:15:00Z'),
        duration: 900,
        mode: 'work',
        completed: false, // Interrupted
        taskId: 'task-2'
      },
      // Day 2 (2025-01-02) - 1 work session, 1 completed
      {
        id: 'session-5',
        startTime: new Date('2025-01-02T11:00:00Z'),
        endTime: new Date('2025-01-02T11:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-2'
      },
      {
        id: 'session-6',
        startTime: new Date('2025-01-02T11:30:00Z'),
        endTime: new Date('2025-01-02T11:45:00Z'),
        duration: 900,
        mode: 'longBreak',
        completed: true
      },
      // Day 3 (2025-01-03) - No sessions
      // Day 4 (2025-01-04) - 2 work sessions, both completed
      {
        id: 'session-7',
        startTime: new Date('2025-01-04T15:00:00Z'),
        endTime: new Date('2025-01-04T15:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-1'
      },
      {
        id: 'session-8',
        startTime: new Date('2025-01-04T16:00:00Z'),
        endTime: new Date('2025-01-04T16:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-3'
      }
    ];
  });

  describe('calculateDailyStats', () => {
    it('should calculate correct daily statistics', () => {
      const date = new Date('2025-01-01');
      const stats = calculator.calculateDailyStats(mockSessions, date);

      expect(stats.date).toBe('2025-01-01');
      expect(stats.completedPomodoros).toBe(2); // Only completed work sessions
      expect(stats.totalWorkTime).toBe(3900); // 1500 + 1500 + 900
      expect(stats.totalBreakTime).toBe(300); // Only short break
      expect(stats.sessions).toHaveLength(4); // All sessions for that day
    });

    it('should return zero stats for day with no sessions', () => {
      const date = new Date('2025-01-03');
      const stats = calculator.calculateDailyStats(mockSessions, date);

      expect(stats.date).toBe('2025-01-03');
      expect(stats.completedPomodoros).toBe(0);
      expect(stats.totalWorkTime).toBe(0);
      expect(stats.totalBreakTime).toBe(0);
      expect(stats.sessions).toHaveLength(0);
    });

    it('should handle day with only break sessions', () => {
      const breakOnlySessions: PomodoroSession[] = [
        {
          id: 'break-1',
          startTime: new Date('2025-01-05T10:00:00Z'),
          endTime: new Date('2025-01-05T10:05:00Z'),
          duration: 300,
          mode: 'shortBreak',
          completed: true
        }
      ];

      const date = new Date('2025-01-05');
      const stats = calculator.calculateDailyStats(breakOnlySessions, date);

      expect(stats.completedPomodoros).toBe(0);
      expect(stats.totalWorkTime).toBe(0);
      expect(stats.totalBreakTime).toBe(300);
    });
  });

  describe('calculateWeeklyStats', () => {
    it('should calculate correct weekly statistics', () => {
      const weekStart = new Date('2024-12-30'); // Monday of the week containing 2025-01-01
      const stats = calculator.calculateWeeklyStats(mockSessions, weekStart);

      expect(stats.weekStart).toBe('2024-12-30');
      expect(stats.weekEnd).toBe('2025-01-05');
      expect(stats.totalPomodoros).toBe(5); // All completed work sessions
      expect(stats.totalWorkTime).toBe(8400); // Sum of all work time (including incomplete)
      expect(stats.totalBreakTime).toBe(1200); // Sum of all break time
      expect(stats.dailyStats).toHaveLength(7); // 7 days in a week
    });

    it('should include all days of the week even if no sessions', () => {
      const weekStart = new Date('2025-01-06'); // Week with no sessions
      const stats = calculator.calculateWeeklyStats(mockSessions, weekStart);

      expect(stats.dailyStats).toHaveLength(7);
      expect(stats.totalPomodoros).toBe(0);
      expect(stats.totalWorkTime).toBe(0);
      expect(stats.totalBreakTime).toBe(0);
    });
  });

  describe('calculateRangeStats', () => {
    it('should calculate statistics for date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-04');
      const stats = calculator.calculateRangeStats(mockSessions, startDate, endDate);

      expect(stats.totalPomodoros).toBe(5);
      expect(stats.totalWorkTime).toBe(8400);
      expect(stats.totalBreakTime).toBe(1200);
      expect(stats.averageDailyPomodoros).toBe(1.25); // 5 pomodoros / 4 days
      expect(stats.averageDailyWorkTime).toBe(2100); // 8400 / 4 days
      expect(stats.dailyStats).toHaveLength(4);
    });

    it('should handle single day range', () => {
      const date = new Date('2025-01-01');
      const stats = calculator.calculateRangeStats(mockSessions, date, date);

      expect(stats.dailyStats).toHaveLength(1);
      expect(stats.totalPomodoros).toBe(2);
      expect(stats.averageDailyPomodoros).toBe(2);
    });
  });

  describe('calculateTaskStats', () => {
    it('should calculate statistics for specific task', () => {
      const stats = calculator.calculateTaskStats(mockSessions, 'task-1');

      expect(stats.totalPomodoros).toBe(3); // All work sessions for task-1
      expect(stats.completedPomodoros).toBe(3); // All are completed for task-1
      expect(stats.totalWorkTime).toBe(4500); // 1500 + 1500 + 1500
      expect(stats.averageSessionDuration).toBe(1500); // 4500 / 3
      expect(stats.sessions).toHaveLength(3); // All sessions for task-1
    });

    it('should return zero stats for non-existent task', () => {
      const stats = calculator.calculateTaskStats(mockSessions, 'non-existent');

      expect(stats.totalPomodoros).toBe(0);
      expect(stats.completedPomodoros).toBe(0);
      expect(stats.totalWorkTime).toBe(0);
      expect(stats.averageSessionDuration).toBe(0);
      expect(stats.sessions).toHaveLength(0);
    });
  });

  describe('calculateProductivityTrend', () => {
    it('should detect increasing trend', () => {
      // Create sessions with clear increasing pattern
      const trendSessions: PomodoroSession[] = [];
      
      // First half: 1 session per day
      for (let i = 0; i < 3; i++) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i);
        
        trendSessions.push({
          id: `trend-${i}-0`,
          startTime: new Date(date.getTime()),
          endTime: new Date(date.getTime() + 1500000),
          duration: 1500,
          mode: 'work',
          completed: true
        });
      }
      
      // Second half: 5 sessions per day
      for (let i = 3; i < 7; i++) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i);
        
        for (let j = 0; j < 5; j++) {
          trendSessions.push({
            id: `trend-${i}-${j}`,
            startTime: new Date(date.getTime() + j * 3600000),
            endTime: new Date(date.getTime() + j * 3600000 + 1500000),
            duration: 1500,
            mode: 'work',
            completed: true
          });
        }
      }

      const trend = calculator.calculateProductivityTrend(trendSessions, 7, new Date('2025-01-07'));

      expect(trend.trend).toBe('increasing');
      expect(trend.changePercentage).toBeGreaterThan(0);
      expect(trend.dailyAverages).toHaveLength(7);
    });

    it('should detect stable trend', () => {
      // Create sessions with stable pattern
      const stableSessions: PomodoroSession[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i);
        
        // Add same number of sessions each day
        for (let j = 0; j < 3; j++) {
          stableSessions.push({
            id: `stable-${i}-${j}`,
            startTime: new Date(date.getTime() + j * 3600000),
            endTime: new Date(date.getTime() + j * 3600000 + 1500000),
            duration: 1500,
            mode: 'work',
            completed: true
          });
        }
      }

      const trend = calculator.calculateProductivityTrend(stableSessions, 7);

      expect(trend.trend).toBe('stable');
      expect(Math.abs(trend.changePercentage)).toBeLessThan(5);
    });

    it('should handle insufficient data', () => {
      const trend = calculator.calculateProductivityTrend([], 7);

      expect(trend.trend).toBe('stable');
      expect(trend.changePercentage).toBe(0);
      expect(trend.dailyAverages).toHaveLength(7); // Still returns 7 days with 0 values
      expect(trend.dailyAverages.every(val => val === 0)).toBe(true);
    });
  });

  describe('calculateBestWorkingHours', () => {
    it('should identify best and worst working hours', () => {
      const analysis = calculator.calculateBestWorkingHours(mockSessions);

      expect(analysis.hourlyStats).toHaveLength(24);
      expect(analysis.bestHour).toBeDefined();
      expect(analysis.worstHour).toBeDefined();
      expect(analysis.bestHour).toBeGreaterThanOrEqual(0);
      expect(analysis.bestHour).toBeLessThan(24);
      expect(analysis.worstHour).toBeGreaterThanOrEqual(0);
      expect(analysis.worstHour).toBeLessThan(24);

      // Check that hours with completed work sessions have data
      const totalCompletedSessions = analysis.hourlyStats.reduce(
        (sum, hour) => sum + hour.completedPomodoros, 0
      );
      expect(totalCompletedSessions).toBe(5); // Total completed work sessions
      
      // Find hours that actually have sessions
      const hoursWithSessions = analysis.hourlyStats.filter(h => h.completedPomodoros > 0);
      expect(hoursWithSessions.length).toBeGreaterThan(0);
      
      // Verify that best and worst hours are valid
      expect(analysis.bestHour).toBeGreaterThanOrEqual(0);
      expect(analysis.bestHour).toBeLessThan(24);
      expect(analysis.worstHour).toBeGreaterThanOrEqual(0);
      expect(analysis.worstHour).toBeLessThan(24);
    });

    it('should handle no completed work sessions', () => {
      const noWorkSessions: PomodoroSession[] = [
        {
          id: 'break-only',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T10:05:00Z'),
          duration: 300,
          mode: 'shortBreak',
          completed: true
        }
      ];

      const analysis = calculator.calculateBestWorkingHours(noWorkSessions);

      expect(analysis.hourlyStats.every(h => h.completedPomodoros === 0)).toBe(true);
      expect(analysis.hourlyStats.every(h => h.averageDuration === 0)).toBe(true);
    });
  });
});