import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskCreateInput, TaskUpdateInput, TaskFilter, TaskStats } from '../../core/task/types';
import { TaskManager } from '../../core/task/TaskManager';

interface TaskPanelProps {
  onClose?: () => void;
  onTaskSelect?: (task: Task) => void;
  selectedTaskId?: string;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ 
  onClose, 
  onTaskSelect,
  selectedTaskId 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskEstimatedPomodoros, setNewTaskEstimatedPomodoros] = useState(1);
  
  const taskManager = useMemo(() => new TaskManager(), []);

  useEffect(() => {
    // Load initial tasks
    loadTasks();

    // Subscribe to task events
    const handleTaskEvent = () => {
      loadTasks();
    };

    taskManager.subscribe('created', handleTaskEvent);
    taskManager.subscribe('updated', handleTaskEvent);
    taskManager.subscribe('deleted', handleTaskEvent);
    taskManager.subscribe('completed', handleTaskEvent);

    return () => {
      taskManager.unsubscribe('created', handleTaskEvent);
      taskManager.unsubscribe('updated', handleTaskEvent);
      taskManager.unsubscribe('deleted', handleTaskEvent);
      taskManager.unsubscribe('completed', handleTaskEvent);
    };
  }, [taskManager]);

  const loadTasks = () => {
    const allTasks = taskManager.getAllTasks();
    setTasks(allTasks);
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply status filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(task => !task.isCompleted);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.isCompleted);
        break;
      // 'all' shows all tasks
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [tasks, filter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    return taskManager.getTaskStats();
  }, [tasks, taskManager]);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      return;
    }

    const input: TaskCreateInput = {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      estimatedPomodoros: newTaskEstimatedPomodoros
    };

    try {
      taskManager.createTask(input);
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskEstimatedPomodoros(1);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = (task: Task, updates: TaskUpdateInput) => {
    try {
      taskManager.updateTask(task.id, updates);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('確定要刪除這個任務嗎？')) {
      taskManager.deleteTask(taskId);
    }
  };

  const handleToggleComplete = (task: Task) => {
    handleUpdateTask(task, { isCompleted: !task.isCompleted });
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (task: Task): number => {
    if (task.estimatedPomodoros === 0) return 0;
    return Math.min((task.completedPomodoros / task.estimatedPomodoros) * 100, 100);
  };

  return (
    <div className="task-panel">
      <div className="task-header">
        <h2>任務管理</h2>
        {onClose && (
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="關閉任務管理"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="task-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.activeTasks}</span>
          <span className="stat-label">活動任務</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.completedTasks}</span>
          <span className="stat-label">已完成</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalCompletedPomodoros}</span>
          <span className="stat-label">完成番茄鐘</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.completionRate.toFixed(1)}%</span>
          <span className="stat-label">完成率</span>
        </div>
      </div>

      {/* Controls */}
      <div className="task-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            活動中 ({stats.activeTasks})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            已完成 ({stats.completedTasks})
          </button>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({stats.totalTasks})
          </button>
        </div>

        <div className="task-actions">
          <input
            type="text"
            placeholder="搜尋任務..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            className="create-task-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + 新增任務
          </button>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="create-task-form">
          <h3>新增任務</h3>
          <div className="form-group">
            <label htmlFor="task-title">任務標題 *</label>
            <input
              id="task-title"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="輸入任務標題"
              maxLength={100}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="task-description">任務描述</label>
            <textarea
              id="task-description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="輸入任務描述（可選）"
              rows={3}
              maxLength={500}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="estimated-pomodoros">預估番茄鐘數</label>
            <input
              id="estimated-pomodoros"
              type="number"
              min="1"
              max="50"
              value={newTaskEstimatedPomodoros}
              onChange={(e) => setNewTaskEstimatedPomodoros(parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreateForm(false);
                setNewTaskTitle('');
                setNewTaskDescription('');
                setNewTaskEstimatedPomodoros(1);
              }}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim()}
            >
              建立任務
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchQuery ? '沒有找到符合條件的任務' : 
               filter === 'active' ? '沒有活動中的任務' :
               filter === 'completed' ? '沒有已完成的任務' : '還沒有任何任務'}
            </p>
            {!searchQuery && filter === 'active' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                建立第一個任務
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-item ${task.isCompleted ? 'completed' : ''} ${
                selectedTaskId === task.id ? 'selected' : ''
              }`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="task-main">
                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(task);
                    }}
                  />
                </div>
                
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  
                  <div className="task-meta">
                    <span className="task-date">
                      建立於 {formatDate(task.createdAt)}
                    </span>
                    {task.completedAt && (
                      <span className="task-completed-date">
                        完成於 {formatDate(task.completedAt)}
                      </span>
                    )}
                  </div>
                  
                  <div className="task-progress">
                    <div className="progress-info">
                      <span>
                        {task.completedPomodoros} / {task.estimatedPomodoros} 番茄鐘
                      </span>
                      <span className="progress-percentage">
                        {getProgressPercentage(task).toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${getProgressPercentage(task)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="task-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTask(task);
                  }}
                  title="編輯任務"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  title="刪除任務"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>編輯任務</h3>
            <EditTaskForm
              task={editingTask}
              onSave={(updates) => handleUpdateTask(editingTask, updates)}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Task Form Component
interface EditTaskFormProps {
  task: Task;
  onSave: (updates: TaskUpdateInput) => void;
  onCancel: () => void;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({ task, onSave, onCancel }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task.estimatedPomodoros);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      estimatedPomodoros
    });
  };

  return (
    <div className="edit-task-form">
      <div className="form-group">
        <label htmlFor="edit-task-title">任務標題 *</label>
        <input
          id="edit-task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="edit-task-description">任務描述</label>
        <textarea
          id="edit-task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="edit-estimated-pomodoros">預估番茄鐘數</label>
        <input
          id="edit-estimated-pomodoros"
          type="number"
          min="1"
          max="50"
          value={estimatedPomodoros}
          onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
        />
      </div>
      
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!title.trim()}
        >
          儲存
        </button>
      </div>
    </div>
  );
};

export default TaskPanel;