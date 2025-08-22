"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface BudgetData {
  categories: string[];
  budgeted: number[];
  actual: number[];
  totalBudget: number;
  totalSpent: number;
  variance: number;
}

interface BudgetTrackingChartProps {
  data: BudgetData;
  title?: string;
}

const BudgetTrackingChart: React.FC<BudgetTrackingChartProps> = ({ 
  data, 
  title = "Budget Tracking" 
}) => {
  const options: ApexOptions = {
    colors: ['#6B7C32', '#722F37'], // Olive Green for budgeted, Burgundy for actual
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: data.categories,
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px',
        },
        formatter: function (val: number) {
          return '$' + val.toLocaleString();
        },
      },
    },
    fill: {
      opacity: 0.9,
    },
    tooltip: {
      y: {
        formatter: function (val: number, { seriesIndex, dataPointIndex }) {
          const category = data.categories[dataPointIndex];
          const budgeted = data.budgeted[dataPointIndex];
          const actual = data.actual[dataPointIndex];
          const variance = actual - budgeted;
          const variancePercent = budgeted > 0 ? Math.round((variance / budgeted) * 100) : 0;
          
          if (seriesIndex === 0) {
            return `$${val.toLocaleString()} budgeted`;
          } else {
            return `$${val.toLocaleString()} spent (${variancePercent > 0 ? '+' : ''}${variancePercent}%)`;
          }
        },
      },
      theme: 'light',
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#64748B',
      },
    },
    grid: {
      borderColor: '#F1F5F9',
      strokeDashArray: 3,
    },
  };

  const series = [
    {
      name: 'Budgeted',
      data: data.budgeted,
    },
    {
      name: 'Actual Spent',
      data: data.actual,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const variancePercent = data.totalBudget > 0 ? 
    Math.round(((data.totalSpent - data.totalBudget) / data.totalBudget) * 100) : 0;
  
  const isOverBudget = data.totalSpent > data.totalBudget;

  return (
    <Card className="h-full shadow-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-[#722F37] mb-1">
              {title}
            </h3>
            <p className="text-sm text-slate-500">
              Budget vs Actual Spending
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-[#722F37] mb-1">
              {formatCurrency(data.totalSpent)}
            </div>
            
            <div className="flex items-center gap-2 justify-end">
              {isOverBudget ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              
              <Badge 
                className={cn(
                  "text-xs font-semibold",
                  isOverBudget 
                    ? "bg-red-100 text-red-600 hover:bg-red-100" 
                    : "bg-green-100 text-green-600 hover:bg-green-100"
                )}
              >
                {variancePercent > 0 ? '+' : ''}{variancePercent}%
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[300px] mb-4">
          <Chart
            options={options}
            series={series}
            type="bar"
            height="100%"
          />
        </div>
        
        {/* Summary */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Total Budget
            </p>
            <p className="text-sm font-semibold text-[#6B7C32]">
              {formatCurrency(data.totalBudget)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">
              Remaining
            </p>
            <p className={cn(
              "text-sm font-semibold",
              isOverBudget ? "text-red-500" : "text-green-500"
            )}>
              {formatCurrency(data.totalBudget - data.totalSpent)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">
              Spent
            </p>
            <p className="text-sm font-semibold text-[#722F37]">
              {formatCurrency(data.totalSpent)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetTrackingChart;