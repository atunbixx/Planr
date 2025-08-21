"use client";

import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';
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
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 3,
          borderBottom: '1px solid #F1F5F9',
          pb: 2
        }}>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#722F37',
                fontSize: '1.125rem',
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Budget vs Actual Spending
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#722F37',
                mb: 0.5
              }}
            >
              {formatCurrency(data.totalSpent)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isOverBudget ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: '#EF4444' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: '#10B981' }} />
              )}
              
              <Chip
                label={`${variancePercent > 0 ? '+' : ''}${variancePercent}%`}
                size="small"
                sx={{
                  backgroundColor: isOverBudget ? '#FEE2E2' : '#D1FAE5',
                  color: isOverBudget ? '#EF4444' : '#10B981',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </Box>
        </Box>
        
        {/* Chart */}
        <Box sx={{ height: 300 }}>
          <Chart
            options={options}
            series={series}
            type="bar"
            height="100%"
          />
        </Box>
        
        {/* Summary */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2, 
          pt: 2,
          borderTop: '1px solid #F1F5F9'
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Budget
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#6B7C32' }}>
              {formatCurrency(data.totalBudget)}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Remaining
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600, 
                color: isOverBudget ? '#EF4444' : '#10B981'
              }}
            >
              {formatCurrency(data.totalBudget - data.totalSpent)}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Spent
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#722F37' }}>
              {formatCurrency(data.totalSpent)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BudgetTrackingChart;