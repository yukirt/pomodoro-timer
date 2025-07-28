import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatsFilterManager } from './StatsFilter';
import { PomodoroSession, DailyStats, StatsFilter } from './types';

describe('StatsFilterManager', () => {
  let filterManager: StatsFilterManager;
  let mockSessions: PomodoroSession[];
  let mockDailyStats: DailyStats[];

  beforeEach(() => {
    filterManager = new StatsFilterManager();
    
    // Create comprehensive mock data
    mockSessions = [
      // Task 1 sessions
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
      // Task 2 sessions
      {
        id: 'session-3',
        startTime: new Date('2025-01-02T14:00:00Z'),
        endTime: new Date('2025-01-02T14:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: false,
        taskId: 'task-2'
      },
      {
        id: 'session-4',
        startTime: new Date('2025-01-02T14:30:00Z'),
        endTime: new Date('2025-01-02T14:45:00Z'),
        duration: 900,
        mode: 'longBreak',
        completed: true
      },
      // Weekend session
      {
        id: 'session-5',
        startTime: new Date('2025-01-04T10:00:00Z'), // Saturday
        endTime: new Date('2025-01-04T10:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-1'
      },
      // Different year session
      {
        id: 'session-6',
        startTime: new Date('2024-12-31T23:00:00Z'),
        endTime: new Date('2024-12-31T23:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task-3'
      }
    ];

    mockDailyStats = [
      {
        date: '2025-01-01',
        completedPomodoros: 1,
        totalWorkTime: 1500,
        totalBreakTime: 300,
        sessions: [mockSessions[0], mockSessions[1]]
      },
      {
        date: '2025-01-02',
        completedPomodoros: 0,
        totalWorkTime: 1500,
        totalBreakTime: 900,
        sessions: [mockSessions[2], mockSessions[3]]
      },
      {
        date: '2025-01-04',
        completedPomodoros: 1,
        totalWorkTime: 1500,
        totalBreakTime: 0,
        sessions: [mockSessions[4]]
      }
    ];
  });

  describe('filterSessions', () => {
    it('should filter sessions by date range', () => {
      const filter: StatsFilter = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02T23:59:59Z')
      };

      const filtered = filterManager.filterSessions(mockSessions, filter);

      expect(filtered).toHaveLength(4);
      expect(filtered.every(s => s.startTime >= filter.startDate!)).toBe(true);
      expect(filtered.every(s => s.startTime <= filter.endDate!)).toBe(true);
    });

    it('should filter sessions by task ID', () => {
      const filter: StatsFilter = {
        taskId: 'task-1'
      };

      const filtered = filterManager.filterSessions(mockSessions, filter);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(s => s.taskId === 'task-1')).toBe(true);
    });

    it('should filter sessions by mode', () => {
      const filter: StatsFilter = {
        mode: 'work'
      };

      const filtered = filterManager.filterSessions(mockSessions, filter);

      expect(filtered).toHaveLength(4);
      expect(filtered.every(s => s.mode === 'work')).toBe(true);
    });

    it('should filter sessions by completed status', () => {
      const filter: StatsFilter = {
        completedOnly: true
      };

      const filtered = filterManager.filterSessions(mockSessions, filter);

      expect(filtered).toHaveLength(5);
      expect(filtered.every(s => s.completed)).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filter: StatsFilter = {
        mode: 'work',
        completedOnly: true,
        taskId: 'task-1'
      };

      const filtered = filterManager.filterSessions(mockSessions, filter);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(s => s.mode === 'work' && s.completed && s.taskId === 'task-1')).toBe(true);
    });
  });

  describe('filterDailyStats', () => {
    it('should filter daily stats by date range', () => {
      const filter: StatsFilter = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-01T23:59:59Z')
      };

      const filtered = filterManager.filterDailyStats(mockDailyStats, filter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].date).toBe('2025-01-01');
    });

    it('should recalculate stats when filtering by task', () => {
      const filter: StatsFilter = {
        taskId: 'task-1'
      };

      const filtered = filterManager.filterDailyStats(mockDailyStats, filter);

      // Should still have all days but with recalculated stats
      expect(filtered).toHaveLength(3);
      
      // Day 1 should have 1 completed pomodoro from task-1
      expect(filtered[0].completedPomodoros).toBe(1);
      expect(filtered[0].sessions).toHaveLength(1);
      
      // Day 2 should have 0 completed pomodoros (no task-1 sessions)
      expect(filtered[1].completedPomodoros).toBe(0);
      expect(filtered[1].sessions).toHaveLength(0);
    });
  });

  describe('filterByWeek', () => {
    it('should filter sessions by week', () => {
      const weekStart = new Date('2024-12-30'); // Monday of week containing 2025-01-01
      const filtered = filterManager.filterByWeek(mockSessions, weekStart);

      expect(filtered).toHaveLength(6); // All sessions are within the week range
    });
  });

  describe('filterByMonth', () => {
    it('should filter sessions by month', () => {
      const filtered = filterManager.filterByMonth(mockSessions, 2025, 1); // January 2025

      expect(filtered).toHaveLength(6); // All sessions are in January 2025 or cross into it
      expect(filtered.filter(s => s.startTime.getFullYear() === 2025).length).toBeGreaterThan(0);
    });
  });

  describe('filterByYear', () => {
    it('should filter sessions by year', () => {
      const filtered = filterManager.filterByYear(mockSessions, 2025);

      expect(filtered).toHaveLength(6); // All sessions are in 2025 or cross into it
      expect(filtered.filter(s => s.startTime.getFullYear() === 2025).length).toBeGreaterThan(0);
    });
  });

  describe('filterByRecentDays', () => {
    it('should filter sessions by recent days', () => {
      // Mock current date to be 2025-01-05
      vi.setSystemTime(new Date('2025-01-05T12:00:00Z'));

      const filtered = filterManager.filterByRecentDays(mockSessions, 7);

      // Should include sessions from 2024-12-30 onwards (7 days back from 2025-01-05)
      expect(filtered.length).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });
  });

  describe('filterByWeekdayType', () => {
    it('should filter sessions by weekday', () => {
      const filtered = filterManager.filterByWeekdayType(mockSessions, 'weekday');

      // 2025-01-01 is Wednesday, 2025-01-02 is Thursday, 2024-12-31 is Tuesday
      expect(filtered).toHaveLength(5);
      expect(filtered.every(s => {
        const day = s.startTime.getDay();
        return day !== 0 && day !== 6; // Not Sunday or Saturday
      })).toBe(true);
    });

    it('should filter sessions by weekend', () => {
      const filtered = filterManager.filterByWeekdayType(mockSessions, 'weekend');

      // 2025-01-04 is Saturday
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('session-5');
    });
  });

  describe('filterByTimeRange', () => {
    it('should filter sessions by time range', () => {
      const filtered = filterManager.filterByTimeRange(mockSessions, 17, 22);

      // Sessions starting between 17:00 and 22:00 (5 PM to 10 PM)
      expect(filtered).toHaveLength(5);
      expect(filtered.every(s => {
        const hour = s.startTime.getHours();
        return hour >= 17 && hour <= 22;
      })).toBe(true);
    });
  });

  describe('exportStats', () => {
    it('should export stats as JSON', () => {
      const exported = filterManager.exportStats(mockSessions, mockDailyStats, 'json');

      expect(typeof exported).toBe('object');
      expect(exported).toHaveProperty('sessions');
      expect(exported).toHaveProperty('dailyStats');
      expect(exported).toHaveProperty('exportDate');
      expect(exported).toHaveProperty('totalSessions');
      expect(exported).toHaveProperty('totalWorkTime');
      
      if (typeof exported === 'object') {
        expect(exported.sessions).toHaveLength(mockSessions.length);
        expect(exported.dailyStats).toHaveLength(mockDailyStats.length);
        expect(exported.totalSessions).toBe(mockSessions.length);
      }
    });

    it('should export stats as CSV', () => {
      const exported = filterManager.exportStats(mockSessions, mockDailyStats, 'csv');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('Export Information');
      expect(exported).toContain('Sessions');
      expect(exported).toContain('Daily Statistics');
    });
  });

  describe('exportSessionsToCSV', () => {
    it('should export sessions to CSV format', () => {
      const csv = filterManager.exportSessionsToCSV(mockSessions);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('ID,Start Time,End Time');
      expect(csv).toContain('session-1');
      expect(csv.split('\n')).toHaveLength(mockSessions.length + 1); // +1 for header
    });

    it('should handle CSV escaping', () => {
      const sessionsWithCommas: PomodoroSession[] = [{
        id: 'test,id',
        startTime: new Date('2025-01-01T09:00:00Z'),
        endTime: new Date('2025-01-01T09:25:00Z'),
        duration: 1500,
        mode: 'work',
        completed: true,
        taskId: 'task,with,commas'
      }];

      const csv = filterManager.exportSessionsToCSV(sessionsWithCommas);

      expect(csv).toContain('"test,id"');
      expect(csv).toContain('"task,with,commas"');
    });
  });

  describe('exportDailyStatsToCSV', () => {
    it('should export daily stats to CSV format', () => {
      const csv = filterManager.exportDailyStatsToCSV(mockDailyStats);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Date,Completed Pomodoros');
      expect(csv).toContain('2025-01-01');
      expect(csv.split('\n')).toHaveLength(mockDailyStats.length + 1); // +1 for header
    });
  });

  describe('createPresetFilters', () => {
    it('should create preset filters', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z')); // Wednesday

      const presets = filterManager.createPresetFilters();

      expect(presets).toHaveProperty('today');
      expect(presets).toHaveProperty('yesterday');
      expect(presets).toHaveProperty('thisWeek');
      expect(presets).toHaveProperty('lastWeek');
      expect(presets).toHaveProperty('thisMonth');
      expect(presets).toHaveProperty('lastMonth');
      expect(presets).toHaveProperty('last7Days');
      expect(presets).toHaveProperty('last30Days');
      expect(presets).toHaveProperty('workOnly');
      expect(presets).toHaveProperty('breakOnly');

      // Verify some preset properties
      expect(presets.workOnly.mode).toBe('work');
      expect(presets.workOnly.completedOnly).toBe(true);
      expect(presets.breakOnly.mode).toBe('shortBreak');

      vi.useRealTimers();
    });

    it('should have correct date ranges for presets', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      const presets = filterManager.createPresetFilters();

      // Today should start at beginning of day
      expect(presets.today.startDate?.getHours()).toBe(0);
      expect(presets.today.startDate?.getMinutes()).toBe(0);

      // This week should start on Monday
      const thisWeekStart = presets.thisWeek.startDate!;
      expect(thisWeekStart.getDay()).toBe(1); // Monday

      vi.useRealTimers();
    });
  });
});