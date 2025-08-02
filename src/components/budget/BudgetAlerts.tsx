'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Info, X, ChevronRight, DollarSign, Percent } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface BudgetAlert {
  id: string;
  type: 'overspending' | 'milestone' | 'recommendation' | 'savings';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  percentage?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissed?: boolean;
}

export function BudgetAlerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDismissedAlerts();
    generateAlerts();
  }, []);

  const loadDismissedAlerts = () => {
    const dismissed = localStorage.getItem('dismissed_budget_alerts');
    if (dismissed) {
      setDismissedAlerts(JSON.parse(dismissed));
    }
  };

  const generateAlerts = async () => {
    try {
      // Fetch budget data
      const { data: categories, error: catError } = await supabase
        .from('budget_categories')
        .select('*, budget_expenses(amount, paid_amount)');

      if (catError) throw catError;

      const generatedAlerts: BudgetAlert[] = [];

      // Analyze each category for overspending
      categories?.forEach(category => {
        const spent = category.budget_expenses?.reduce((sum: number, expense: any) => 
          sum + (expense.amount || 0), 0) || 0;
        const budget = category.allocated_amount || 0;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;

        if (percentage >= 100) {
          generatedAlerts.push({
            id: `overspend-${category.id}`,
            type: 'overspending',
            severity: 'high',
            title: `${category.name} budget exceeded`,
            message: `You've spent $${spent.toLocaleString()} of your $${budget.toLocaleString()} budget`,
            category: category.name,
            amount: spent - budget,
            percentage,
          });
        } else if (percentage >= 90) {
          generatedAlerts.push({
            id: `warning-${category.id}`,
            type: 'overspending',
            severity: 'medium',
            title: `${category.name} budget nearly exhausted`,
            message: `${Math.round(percentage)}% of budget spent`,
            category: category.name,
            percentage,
          });
        }
      });

      // Add milestone alerts
      const totalBudget = categories?.reduce((sum, cat) => sum + (cat.allocated_amount || 0), 0) || 0;
      const totalSpent = categories?.reduce((sum, cat) => {
        const catSpent = cat.budget_expenses?.reduce((expSum: number, exp: any) => 
          expSum + (exp.amount || 0), 0) || 0;
        return sum + catSpent;
      }, 0) || 0;

      const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      if (overallPercentage >= 50 && overallPercentage < 75) {
        generatedAlerts.push({
          id: 'milestone-50',
          type: 'milestone',
          severity: 'low',
          title: 'Halfway through your budget',
          message: `You've spent $${totalSpent.toLocaleString()} of your $${totalBudget.toLocaleString()} total budget`,
          percentage: overallPercentage,
        });
      } else if (overallPercentage >= 75 && overallPercentage < 90) {
        generatedAlerts.push({
          id: 'milestone-75',
          type: 'milestone',
          severity: 'medium',
          title: '75% of budget spent',
          message: 'Consider reviewing remaining expenses carefully',
          percentage: overallPercentage,
        });
      }

      // Add recommendations
      if (categories && categories.length > 5) {
        const highestSpendCategory = categories.reduce((prev, current) => {
          const prevSpent = prev.budget_expenses?.reduce((sum: number, exp: any) => 
            sum + (exp.amount || 0), 0) || 0;
          const currentSpent = current.budget_expenses?.reduce((sum: number, exp: any) => 
            sum + (exp.amount || 0), 0) || 0;
          return prevSpent > currentSpent ? prev : current;
        });

        generatedAlerts.push({
          id: 'recommendation-highest',
          type: 'recommendation',
          severity: 'low',
          title: 'Cost-saving opportunity',
          message: `${highestSpendCategory.name} is your highest expense category. Consider comparing vendor quotes.`,
          category: highestSpendCategory.name,
        });
      }

      // Filter out dismissed alerts
      const activeAlerts = generatedAlerts.filter(
        alert => !dismissedAlerts.includes(alert.id)
      );

      setAlerts(activeAlerts);
    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissed_budget_alerts', JSON.stringify(newDismissed));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'overspending':
        return <AlertTriangle className="h-5 w-5" />;
      case 'milestone':
        return <TrendingUp className="h-5 w-5" />;
      case 'recommendation':
        return <Info className="h-5 w-5" />;
      case 'savings':
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getAlertColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getIconColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-green-900 mb-1">
          Your budget is on track!
        </h3>
        <p className="text-sm text-green-700">
          No alerts or warnings at this time. Keep up the great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget Alerts</h3>
        <span className="text-sm text-gray-600">
          {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 ${getAlertColor(alert.severity)} transition-all`}
        >
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${getIconColor(alert.severity)} mr-3`}>
              {getAlertIcon(alert.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{alert.title}</h4>
                  <p className="text-sm opacity-90">{alert.message}</p>
                  
                  {(alert.amount || alert.percentage) && (
                    <div className="flex items-center gap-4 mt-2">
                      {alert.amount && (
                        <span className="flex items-center gap-1 text-sm font-medium">
                          <DollarSign className="h-4 w-4" />
                          ${Math.abs(alert.amount).toLocaleString()} over
                        </span>
                      )}
                      {alert.percentage && (
                        <span className="flex items-center gap-1 text-sm font-medium">
                          <Percent className="h-4 w-4" />
                          {Math.round(alert.percentage)}% spent
                        </span>
                      )}
                    </div>
                  )}
                  
                  {alert.action && (
                    <button
                      onClick={alert.action.onClick}
                      className="flex items-center gap-1 mt-3 text-sm font-medium hover:underline"
                    >
                      {alert.action.label}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-4 p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Alert summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'high').length}
            </p>
            <p className="text-sm text-gray-600">High priority</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {alerts.filter(a => a.severity === 'medium').length}
            </p>
            <p className="text-sm text-gray-600">Medium priority</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {alerts.filter(a => a.severity === 'low').length}
            </p>
            <p className="text-sm text-gray-600">Low priority</p>
          </div>
        </div>
      </div>
    </div>
  );
}