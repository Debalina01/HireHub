
import React from 'react';

export default function ReminderCard({ reminder, onToggleComplete, onDelete }) {
  const { id, text, dueDate, priority, completed } = reminder;

  const getPriorityClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-low';
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateStr;
  };

  return (
    <div className={`reminder-card ${completed ? 'reminder-completed' : ''}`}>

      
     <input
  type="checkbox"
  checked={completed}
  onChange={() => onToggleComplete(id)}
  className="reminder-checkbox"
/>

      
      <div className="reminder-content">
        <p className={`reminder-text ${completed ? 'text-strikethrough' : ''}`}>
          {text}
        </p>

        <div className="reminder-meta">
          <span className="reminder-date">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>

            Due: {formatDueDate(dueDate)}
          </span>

          <span className={`priority-badge ${getPriorityClass(priority)}`}>
            {priority}
          </span>
        </div>
      </div>

      
      <button
        className="reminder-delete-btn"
        onClick={() => onDelete(id)}
        title="Delete Reminder"
        aria-label="Delete Reminder"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

    </div>
  );
}