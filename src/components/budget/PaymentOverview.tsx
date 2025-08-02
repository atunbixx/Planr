'use client';

import { useState } from 'react';
import { Calendar, Clock, DollarSign, CreditCard, AlertCircle, Bell } from 'lucide-react';
import { PaymentSchedule } from './PaymentSchedule';
import { PaymentReminders } from './PaymentReminders';
import { BudgetAlerts } from './BudgetAlerts';

interface PaymentOverviewProps {
  expenses: any[];
  categories: any[];
  onPaymentUpdate?: () => void;
}

export function PaymentOverview({ expenses, categories, onPaymentUpdate }: PaymentOverviewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'reminders' | 'alerts'>('schedule');

  // Calculate payment statistics
  const paymentStats = {
    totalOutstanding: expenses.reduce((sum, exp) => {
      if (exp.payment_status === 'pending' || exp.payment_status === 'partial') {
        return sum + (exp.amount - (exp.paid_amount || 0));
      }
      return sum;
    }, 0),
    totalPaid: expenses.reduce((sum, exp) => sum + (exp.paid_amount || 0), 0),
    upcomingPayments: expenses.filter(exp => {
      if (!exp.payment_due_date || exp.payment_status === 'paid') return false;
      const dueDate = new Date(exp.payment_due_date);
      const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    }).length,
    overduePayments: expenses.filter(exp => {
      if (!exp.payment_due_date || exp.payment_status === 'paid') return false;
      const dueDate = new Date(exp.payment_due_date);
      return dueDate < new Date();
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${paymentStats.totalOutstanding.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${paymentStats.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming (30d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {paymentStats.upcomingPayments}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {paymentStats.overduePayments}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveSubTab('schedule')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeSubTab === 'schedule'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Payment Schedule
              </div>
            </button>
            
            <button
              onClick={() => setActiveSubTab('reminders')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeSubTab === 'reminders'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminders
              </div>
            </button>
            
            <button
              onClick={() => setActiveSubTab('alerts')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeSubTab === 'alerts'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Budget Alerts
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'schedule' && <PaymentSchedule />}
          {activeSubTab === 'reminders' && <PaymentReminders />}
          {activeSubTab === 'alerts' && <BudgetAlerts />}
        </div>
      </div>

      {/* Payment Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Payment Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Schedule vendor payments 3-5 days before the due date to account for processing time</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Keep digital copies of all receipts and invoices for tax purposes</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Consider using a dedicated wedding credit card to track expenses and earn rewards</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Always get final invoices in writing before making full payment</span>
          </li>
        </ul>
      </div>
    </div>
  );
}