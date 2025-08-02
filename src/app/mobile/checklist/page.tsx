'use client';

import { useState } from 'react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { TouchList, TouchListItem } from '@/components/mobile/TouchList';
import { QuickActions } from '@/components/mobile/QuickActions';
import { useWeddingChecklist } from '@/hooks/useWeddingChecklist';
import { cn } from '@/utils/cn';

interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export default function MobileChecklistPage() {
  const { tasks, toggleTask, loading, refetch } = useWeddingChecklist();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const categories = ['all', 'venue', 'vendors', 'attire', 'planning', 'day-of'];

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const completedCount = filteredTasks.filter(task => task.completed).length;
  const totalCount = filteredTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleToggleTask = async (taskId: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    await toggleTask(taskId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'venue':
        return 'fas fa-building';
      case 'vendors':
        return 'fas fa-store';
      case 'attire':
        return 'fas fa-tshirt';
      case 'planning':
        return 'fas fa-clipboard-list';
      case 'day-of':
        return 'fas fa-calendar-day';
      default:
        return 'fas fa-check-square';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Wedding Checklist" showBack />

      {/* Progress Overview */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Progress</h2>
          <span className="text-2xl font-bold text-accent">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === category
                  ? "bg-accent text-white"
                  : "bg-gray-100 text-gray-700"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <PullToRefresh onRefresh={refetch} className="flex-1">
        <TouchList className="bg-white">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTasks.has(task.id);
            
            return (
              <TouchListItem
                key={task.id}
                rightActions={[
                  {
                    label: 'Delete',
                    icon: 'fas fa-trash',
                    onClick: () => console.log('Delete task:', task.id),
                    color: 'danger',
                  },
                ]}
                onLongPress={() => toggleExpanded(task.id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={cn(
                        "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed
                          ? "bg-accent border-accent"
                          : "border-gray-300"
                      )}
                    >
                      {task.completed && (
                        <i className="fas fa-check text-white text-xs" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={cn(
                            "font-medium",
                            task.completed && "line-through text-gray-500"
                          )}>
                            {task.title}
                          </h3>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              <i className={cn(getCategoryIcon(task.category), "mr-1")} />
                              {task.category}
                            </span>
                            
                            {task.priority && (
                              <span className={cn("text-xs", getPriorityColor(task.priority))}>
                                <i className="fas fa-flag mr-1" />
                                {task.priority}
                              </span>
                            )}
                            
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                <i className="fas fa-calendar mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand Button */}
                        {task.description && (
                          <button
                            onClick={() => toggleExpanded(task.id)}
                            className="ml-2 p-1 text-gray-400"
                          >
                            <i className={cn(
                              "fas transition-transform",
                              isExpanded ? "fa-chevron-up" : "fa-chevron-down"
                            )} />
                          </button>
                        )}
                      </div>

                      {/* Expanded Description */}
                      {task.description && isExpanded && (
                        <p className="mt-2 text-sm text-gray-600">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TouchListItem>
            );
          })}
        </TouchList>
      </PullToRefresh>

      {/* Quick Actions */}
      <QuickActions
        actions={[
          { 
            label: 'Add Task', 
            icon: 'fas fa-plus', 
            href: '/dashboard/checklist/new',
            color: 'bg-accent' 
          },
        ]}
      />
    </div>
  );
}