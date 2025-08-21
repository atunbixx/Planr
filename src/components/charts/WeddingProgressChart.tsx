"use client";

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface WeddingProgressData {
  categories: string[];
  completed: number[];
  total: number[];
}

interface WeddingProgressChartProps {
  data: WeddingProgressData;
  title?: string;
}

const WeddingProgressChart: React.FC<WeddingProgressChartProps> = ({ 
  data, 
  title = "Wedding Planning Progress" 
}) => {
  const options: ApexOptions = {
    colors: ['#722F37', '#6B7C32'], // Burgundy and Olive Green
    chart: {
      type: 'bar',
      stacked: false,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '60%',
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
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val: number, { seriesIndex, dataPointIndex }) {
          if (seriesIndex === 0) {
            const total = data.total[dataPointIndex];
            const percentage = total > 0 ? Math.round((val / total) * 100) : 0;
            return `${val} completed (${percentage}%)`;
          }
          return `${val} total tasks`;
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
      name: 'Completed',
      data: data.completed,
    },
    {
      name: 'Remaining',
      data: data.total.map((total, index) => total - data.completed[index]),
    },
  ];

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#722F37',
              fontSize: '1.125rem'
            }}
          >
            {title}
          </Typography>
        </Box>
        
        <Box sx={{ height: 300 }}>
          <Chart
            options={options}
            series={series}
            type="bar"
            height="100%"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeddingProgressChart;