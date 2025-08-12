'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { Table } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileVenueCanvasProps {
  width: number;
  height: number;
  tables: Table[];
  onTableSelect?: (tableId: string) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
  selectedTableId?: string | null;
}

interface ViewState {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_BY = 1.2;

export default function MobileVenueCanvas({
  width,
  height,
  tables,
  onTableSelect,
  onTableMove,
  selectedTableId,
}: MobileVenueCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch gesture handlers
  const handlePinch = useCallback((scale: number, center: { x: number; y: number }) => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const oldScale = viewState.scale;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale * scale));

    // Get pointer position relative to stage
    const pointerPosition = {
      x: center.x - stage.x(),
      y: center.y - stage.y(),
    };

    // Calculate new position
    const mousePointTo = {
      x: (pointerPosition.x / oldScale) * newScale,
      y: (pointerPosition.y / oldScale) * newScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x,
      y: center.y - mousePointTo.y,
    };

    setViewState({
      scale: newScale,
      x: newPos.x,
      y: newPos.y,
    });
  }, [viewState.scale]);

  const handlePan = useCallback((delta: { x: number; y: number }) => {
    if (!isPanning) return;
    
    setViewState(prev => ({
      ...prev,
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  }, [isPanning]);

  const handleDoubleTap = useCallback((point: { x: number; y: number }) => {
    // Reset zoom on double tap
    setViewState({ scale: 1, x: 0, y: 0 });
  }, []);

  const handleTap = useCallback((point: { x: number; y: number }) => {
    if (!stageRef.current) return;

    // Convert screen coordinates to stage coordinates
    const stage = stageRef.current;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(point);

    // Check if tap is on a table
    const clickedTable = tables.find(table => {
      const distance = Math.sqrt(
        Math.pow(table.x - pos.x, 2) + Math.pow(table.y - pos.y, 2)
      );
      return distance < 50; // Adjust based on table size
    });

    if (clickedTable && onTableSelect) {
      onTableSelect(clickedTable.id);
    }
  }, [tables, onTableSelect]);

  // Set up touch gestures
  const touchRef = useTouchGestures<HTMLDivElement>({
    onPinch: handlePinch,
    onPan: handlePan,
    onPanStart: () => setIsPanning(true),
    onPanEnd: () => setIsPanning(false),
    onDoubleTap: handleDoubleTap,
    onTap: handleTap,
  });

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(viewState.scale * SCALE_BY, MAX_SCALE);
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };
    
    setViewState({
      scale: newScale,
      x: center.x - (center.x - viewState.x) * (newScale / viewState.scale),
      y: center.y - (center.y - viewState.y) * (newScale / viewState.scale),
    });
  };

  const handleZoomOut = () => {
    const newScale = Math.max(viewState.scale / SCALE_BY, MIN_SCALE);
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };
    
    setViewState({
      scale: newScale,
      x: center.x - (center.x - viewState.x) * (newScale / viewState.scale),
      y: center.y - (center.y - viewState.y) * (newScale / viewState.scale),
    });
  };

  const handleReset = () => {
    setViewState({ scale: 1, x: 0, y: 0 });
  };

  // Render table based on shape
  const renderTable = (table: Table) => {
    const isSelected = table.id === selectedTableId;
    const fill = isSelected ? '#6366f1' : '#e5e7eb';
    const stroke = isSelected ? '#4f46e5' : '#9ca3af';

    switch (table.shape) {
      case 'round':
        return (
          <Group key={table.id} x={table.x} y={table.y}>
            <Circle
              radius={40}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
              shadowBlur={isSelected ? 10 : 0}
            />
            <Text
              text={table.name}
              fontSize={14}
              fontStyle="bold"
              fill="#374151"
              width={80}
              height={80}
              align="center"
              verticalAlign="middle"
              offsetX={40}
              offsetY={40}
            />
            <Text
              text={`${table.capacity} seats`}
              fontSize={10}
              fill="#6b7280"
              width={80}
              align="center"
              offsetX={40}
              offsetY={-50}
            />
          </Group>
        );
      case 'rectangular':
        return (
          <Group key={table.id} x={table.x} y={table.y}>
            <Rect
              width={100}
              height={60}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
              cornerRadius={8}
              offsetX={50}
              offsetY={30}
              shadowBlur={isSelected ? 10 : 0}
            />
            <Text
              text={table.name}
              fontSize={14}
              fontStyle="bold"
              fill="#374151"
              width={100}
              align="center"
              offsetX={50}
            />
            <Text
              text={`${table.capacity} seats`}
              fontSize={10}
              fill="#6b7280"
              width={100}
              align="center"
              offsetX={50}
              offsetY={-15}
            />
          </Group>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full touch-none">
      <div 
        ref={(el) => {
          if (el) {
            (touchRef as any).current = el;
            containerRef.current = el;
          }
        }}
        className="w-full h-full bg-gray-50 overflow-hidden"
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={viewState.scale}
          scaleY={viewState.scale}
          x={viewState.x}
          y={viewState.y}
          className={cn(isPanning && 'cursor-grabbing')}
        >
          <Layer>
            {/* Grid background */}
            {Array.from({ length: Math.ceil(width / 50) + 1 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 50, 0, i * 50, height]}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: Math.ceil(height / 50) + 1 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 50, width, i * 50]}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            ))}

            {/* Tables */}
            {tables.map(renderTable)}
          </Layer>
        </Stage>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleZoomOut}
            className="h-10 w-10 shadow-lg"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleZoomIn}
            className="h-10 w-10 shadow-lg"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>
        
        <Button
          size="icon"
          variant="secondary"
          onClick={handleReset}
          className="h-10 w-10 shadow-lg"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 right-4 bg-white/90 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-center text-muted-foreground">
          Pinch to zoom • Drag to pan • Tap to select • Double tap to reset
        </p>
      </div>
    </div>
  );
}