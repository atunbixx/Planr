'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PaymentMilestone {
  id: string;
  expense_id: string;
  vendor_name: string;
  category_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'scheduled' | 'paid' | 'overdue' | 'partial';
  paid_amount: number;
  notes?: string;
}

export function PaymentSchedule() {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'paid'>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPaymentMilestones();
  }, []);

  const fetchPaymentMilestones = async () => {
    try {
      const { data: expenses, error } = await supabase
        .from('budget_expenses')
        .select(`
          id,
          description,
          vendor_name,
          amount,
          paid_amount,
          payment_due_date,
          payment_status,
          budget_categories (
            name,
            icon
          )
        `)
        .not('payment_due_date', 'is', null)
        .order('payment_due_date', { ascending: true });

      if (error) throw error;

      const formattedMilestones = expenses?.map(expense => ({
        id: expense.id,
        expense_id: expense.id,
        vendor_name: expense.vendor_name || 'Unknown Vendor',
        category_name: expense.budget_categories?.name || 'Uncategorized',
        description: expense.description,
        amount: expense.amount,
        due_date: expense.payment_due_date,
        status: getPaymentStatus(expense),
        paid_amount: expense.paid_amount || 0,
      })) || [];

      setMilestones(formattedMilestones);
    } catch (error) {
      console.error('Error fetching payment milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (expense: any): PaymentMilestone['status'] => {
    const now = new Date();
    const dueDate = new Date(expense.payment_due_date);
    
    if (expense.payment_status === 'paid') return 'paid';
    if (expense.payment_status === 'partial') return 'partial';
    if (isAfter(now, dueDate)) return 'overdue';
    return 'scheduled';
  };

  const filteredMilestones = milestones.filter(milestone => {
    switch (filter) {
      case 'upcoming':
        return milestone.status === 'scheduled' && 
               differenceInDays(new Date(milestone.due_date), new Date()) <= 30;
      case 'overdue':
        return milestone.status === 'overdue';
      case 'paid':
        return milestone.status === 'paid';
      default:
        return true;
    }
  });

  const getStatusColor = (status: PaymentMilestone['status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const updatePaymentStatus = async (milestoneId: string, status: 'paid' | 'partial', paidAmount?: number) => {
    try {
      const { error } = await supabase
        .from('budget_expenses')
        .update({
          payment_status: status,
          paid_amount: paidAmount || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      if (error) throw error;

      // Refresh the milestones
      fetchPaymentMilestones();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track vendor payments and milestones
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['all', 'upcoming', 'overdue', 'paid'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === filterOption
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payment timeline */}
      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">No payment milestones found</p>
            <p className="text-sm text-gray-500 mt-1">
              Payments will appear here when you add due dates to expenses
            </p>
          </div>
        ) : (
          filteredMilestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                      {milestone.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getDaysUntilDue(milestone.due_date)}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900">{milestone.vendor_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      ${milestone.amount.toLocaleString()}
                    </span>
                    {milestone.status === 'partial' && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        ${milestone.paid_amount.toLocaleString()} paid
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {milestone.status !== 'paid' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updatePaymentStatus(milestone.id, 'paid', milestone.amount)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Mark as paid"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="View invoice"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar for partial payments */}
              {milestone.status === 'partial' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Payment progress</span>
                    <span>{Math.round((milestone.paid_amount / milestone.amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${(milestone.paid_amount / milestone.amount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 font-medium">Upcoming</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {milestones.filter(m => m.status === 'scheduled').length}
          </p>
          <p className="text-sm text-blue-700 mt-1">payments scheduled</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-900 font-medium">Overdue</span>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">
            {milestones.filter(m => m.status === 'overdue').length}
          </p>
          <p className="text-sm text-red-700 mt-1">require attention</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-green-900 font-medium">Completed</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {milestones.filter(m => m.status === 'paid').length}
          </p>
          <p className="text-sm text-green-700 mt-1">payments made</p>
        </div>
      </div>
    </div>
  );
}