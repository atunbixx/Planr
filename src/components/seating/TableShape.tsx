import React from 'react';
import { Group, Circle, Rect, RegularPolygon, Text } from 'react-konva';
import { Table } from '@prisma/client';

interface TableShapeProps {
  table: Table & {
    guestCount?: number;
    maxCapacity: number;
  };
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onDragStart?: () => void;
  onDragEnd?: (e: any) => void;
}

export const TableShape: React.FC<TableShapeProps> = ({
  table,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  const getShape = () => {
    const fillColor = table.guestCount === table.maxCapacity ? '#fef3c7' : '#f3f4f6';
    const strokeColor = isSelected ? '#6366f1' : '#9ca3af';
    const strokeWidth = isSelected ? 3 : 2;
    const shadowBlur = isDragging ? 15 : 5;

    const commonProps = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      shadowColor: '#000',
      shadowBlur,
      shadowOpacity: isDragging ? 0.3 : 0.1,
      shadowOffsetX: isDragging ? 5 : 2,
      shadowOffsetY: isDragging ? 5 : 2,
    };

    switch (table.shape) {
      case 'round':
        return (
          <Circle
            radius={50}
            {...commonProps}
          />
        );

      case 'rectangular':
        return (
          <Rect
            width={table.width || 120}
            height={table.height || 80}
            offsetX={(table.width || 120) / 2}
            offsetY={(table.height || 80) / 2}
            cornerRadius={8}
            {...commonProps}
          />
        );

      case 'square':
        return (
          <Rect
            width={80}
            height={80}
            offsetX={40}
            offsetY={40}
            cornerRadius={8}
            {...commonProps}
          />
        );

      case 'oval':
        return (
          <RegularPolygon
            sides={100}
            radius={50}
            scaleX={1.5}
            {...commonProps}
          />
        );

      default:
        return (
          <Circle
            radius={50}
            {...commonProps}
          />
        );
    }
  };

  const getTextPosition = () => {
    switch (table.shape) {
      case 'rectangular':
        return { x: 0, y: -10 };
      case 'square':
        return { x: 0, y: -5 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const textPos = getTextPosition();

  return (
    <Group
      x={table.x_position}
      y={table.y_position}
      rotation={table.rotation || 0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
      style={{ cursor: 'move' }}
    >
      {getShape()}
      
      {/* Table number */}
      <Text
        x={textPos.x}
        y={textPos.y - 10}
        text={table.table_number}
        fontSize={16}
        fontStyle="bold"
        fill="#1f2937"
        align="center"
        verticalAlign="middle"
        offsetX={0}
      />
      
      {/* Guest count */}
      <Text
        x={textPos.x}
        y={textPos.y + 10}
        text={`${table.guestCount || 0}/${table.maxCapacity}`}
        fontSize={14}
        fill="#6b7280"
        align="center"
        verticalAlign="middle"
        offsetX={0}
      />
      
      {/* Table name (if exists) */}
      {table.table_name && (
        <Text
          x={textPos.x}
          y={textPos.y + 30}
          text={table.table_name}
          fontSize={12}
          fill="#9ca3af"
          align="center"
          verticalAlign="middle"
          offsetX={0}
          width={100}
          wrap="word"
        />
      )}
    </Group>
  );
};