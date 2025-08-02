'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Calendar, Clock, DollarSign, Mail, MessageSquare } from 'lucide-react';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PaymentReminder {
  id: string;
  expense_id: string;
  vendor_name: string;
  amount: number;
  due_date: string;
  reminder_date: string;
  reminder_type: 'email' | 'sms' | 'push' | 'all';
  is_active: boolean;
  frequency: 'once' | 'weekly' | 'monthly';
  last_sent?: string;
}

interface ReminderSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  default_days_before: number;
}

export function PaymentReminders() {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [settings, setSettings] = useState<ReminderSettings>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    default_days_before: 7
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReminders();
    loadSettings();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data: expenses, error } = await supabase
        .from('budget_expenses')
        .select(`
          id,
          vendor_name,
          amount,
          payment_due_date,
          description
        `)
        .not('payment_due_date', 'is', null)
        .eq('payment_status', 'pending')
        .order('payment_due_date', { ascending: true });

      if (error) throw error;

      // Create reminders from expenses (in a real app, these would be stored in a separate table)
      const reminderData = expenses?.map(expense => ({
        id: `reminder-${expense.id}`,
        expense_id: expense.id,
        vendor_name: expense.vendor_name || 'Unknown Vendor',
        amount: expense.amount,
        due_date: expense.payment_due_date,
        reminder_date: format(addDays(new Date(expense.payment_due_date), -7), 'yyyy-MM-dd'),
        reminder_type: 'all' as const,
        is_active: true,
        frequency: 'once' as const,
      })) || [];

      setReminders(reminderData);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    // In a real app, load from user preferences
    const savedSettings = localStorage.getItem('payment_reminder_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('payment_reminder_settings', JSON.stringify(settings));
    setShowSettings(false);
  };

  const toggleReminder = async (reminderId: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, is_active: !reminder.is_active }
          : reminder
      )
    );
  };

  const updateReminderType = (reminderId: string, type: PaymentReminder['reminder_type']) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, reminder_type: type }
          : reminder
      )
    );
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_date);
      const daysUntil = differenceInDays(reminderDate, now);
      return reminder.is_active && daysUntil >= 0 && daysUntil <= 7;
    });
  };

  const getReminderTypeIcon = (type: PaymentReminder['reminder_type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const upcomingReminders = getUpcomingReminders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Reminders</h3>
          <p className="text-sm text-gray-600 mt-1">
            Never miss a vendor payment
          </p>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">Reminder Settings</h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email reminders</span>
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">SMS reminders</span>
              <input
                type="checkbox"
                checked={settings.sms_enabled}
                onChange={(e) => setSettings({ ...settings, sms_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Push notifications</span>
              <input
                type="checkbox"
                checked={settings.push_enabled}
                onChange={(e) => setSettings({ ...settings, push_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
            </label>
            
            <div>
              <label className="text-sm text-gray-700">Default reminder timing</label>
              <select
                value={settings.default_days_before}
                onChange={(e) => setSettings({ ...settings, default_days_before: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 text-sm"
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
                <option value={14}>2 weeks before</option>
                <option value={30}>1 month before</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Reminders Alert */}
      {upcomingReminders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">
                {upcomingReminders.length} upcoming payment{upcomingReminders.length > 1 ? 's' : ''} this week
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                You'll receive reminders based on your notification preferences
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BellOff className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">No payment reminders set</p>
            <p className="text-sm text-gray-500 mt-1">
              Reminders will be created when you add payment due dates
            </p>
          </div>
        ) : (
          reminders.map(reminder => {
            const daysUntilDue = differenceInDays(new Date(reminder.due_date), new Date());
            const daysUntilReminder = differenceInDays(new Date(reminder.reminder_date), new Date());
            
            return (
              <div
                key={reminder.id}
                className={`bg-white border rounded-lg p-4 transition-opacity ${
                  reminder.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{reminder.vendor_name}</h4>
                      {daysUntilReminder <= 0 && reminder.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                          Reminder sent
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${reminder.amount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due {format(new Date(reminder.due_date), 'MMM d')}
                        {daysUntilDue > 0 && ` (${daysUntilDue} days)`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Remind {format(new Date(reminder.reminder_date), 'MMM d')}
                      </span>
                    </div>
                    
                    {/* Reminder type selector */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm text-gray-600">Send via:</span>
                      <div className="flex gap-1">
                        {(['email', 'sms', 'push', 'all'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => updateReminderType(reminder.id, type)}
                            className={`p-1.5 rounded transition-colors ${
                              reminder.reminder_type === type
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={type === 'all' ? 'All channels' : type}
                          >
                            {type === 'all' ? (
                              <span className="text-xs px-1">ALL</span>
                            ) : (
                              getReminderTypeIcon(type)
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      reminder.is_active
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {reminder.is_active ? (
                      <Bell className="h-5 w-5" />
                    ) : (
                      <BellOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}