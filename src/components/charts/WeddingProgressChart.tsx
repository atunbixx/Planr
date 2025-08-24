"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="h-full bg-white border border-stroke shadow-card-2 dark:bg-dark-2 dark:border-dark-3">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#722F37] dark:text-white">
            {title}
          </h3>
        </div>
        
        <div className="h-[300px]">
          <Chart
            options={options}
            series={series}
            type="bar"
            height="100%"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WeddingProgressChart;