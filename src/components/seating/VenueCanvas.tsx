'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';
import Konva from 'konva';
import { TableShape } from './TableShape';
import { useSeatingStore } from '@/store/seatingStore';
import { useSeatingWebSocket } from '@/hooks/useWebSocket';

interface VenueCanvasProps {
  layoutId: string;
  onTableSelect?: (tableId: string | null) => void;
  mode?: 'view' | 'edit' | 'assign';
}

export const VenueCanvas: React.FC<VenueCanvasProps> = ({
  layoutId,
  onTableSelect,
  mode = 'edit',
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  const {
    tables,
    selectedTableId,
    showGrid,
    snapToGrid,
    gridSize,
    selectTable,
    updateTablePosition,
    getTableGuestCount,
  } = useSeatingStore();
  
  const { moveTable, moveCursor, connected } = useSeatingWebSocket(layoutId);

  // Update canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = stageRef.current?.container();
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const boundedScale = Math.max(0.5, Math.min(2, newScale));

    stage.scale({ x: boundedScale, y: boundedScale });
    setStageScale(boundedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    };
    
    stage.position(newPos);
    setStagePos(newPos);
  }, []);

  // Handle table drag
  const handleTableDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, tableId: string) => {
    const node = e.target;
    let x = node.x();
    let y = node.y();

    // Snap to grid if enabled
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
      node.position({ x, y });
    }

    // Update local state
    updateTablePosition(tableId, x, y);

    // Broadcast position change
    if (connected) {
      moveTable(tableId, x, y);
    }
  }, [snapToGrid, gridSize, updateTablePosition, moveTable, connected]);

  // Handle table selection
  const handleTableSelect = useCallback((tableId: string) => {
    selectTable(tableId);
    onTableSelect?.(tableId);
  }, [selectTable, onTableSelect]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Check if we clicked on empty space
    if (e.target === e.target.getStage()) {
      selectTable(null);
      onTableSelect?.(null);
    }
  }, [selectTable, onTableSelect]);

  // Track cursor movement for collaboration
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!connected || mode !== 'edit') return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (pointer) {
      // Throttle cursor updates
      moveCursor(pointer.x, pointer.y);
    }
  }, [connected, mode, moveCursor]);

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const width = dimensions.width / stageScale;
    const height = dimensions.height / stageScale;
    const startX = -stagePos.x / stageScale;
    const startY = -stagePos.y / stageScale;

    // Vertical lines
    for (let x = Math.floor(startX / gridSize) * gridSize; x < startX + width; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, startY + height]}
          stroke="#e5e7eb"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = Math.floor(startY / gridSize) * gridSize; y < startY + height; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, startX + width, y]}
          stroke="#e5e7eb"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return <Group>{lines}</Group>;
  };

  // Render tables
  const renderTables = () => {
    return tables.map((table) => {
      const guestCount = getTableGuestCount(table.id);
      
      return (
        <TableShape
          key={table.id}
          table={{
            ...table,
            guestCount,
            maxCapacity: table.capacity,
          }}
          isSelected={selectedTableId === table.id}
          isDragging={false}
          onSelect={() => handleTableSelect(table.id)}
          onDragEnd={(e) => handleTableDragEnd(e, table.id)}
        />
      );
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={mode === 'view' || mode === 'edit'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleMouseMove}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
      >
        <Layer>
          {renderGrid()}
          {renderTables()}
        </Layer>
      </Stage>
    </div>
  );
};