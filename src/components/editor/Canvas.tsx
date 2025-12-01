import React, { useMemo, useRef, useState } from 'react';
import { useEditor } from '../../state/editorSlice';
import type { EditorLayer } from '../../types/editor';

interface Point {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

interface DragState {
  layerId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

function layerTransform(layer: EditorLayer) {
  const { x, y, rotation = 0, scaleX = 1, scaleY = 1 } = layer.transform;
  return `translate(${x} ${y}) rotate(${rotation} ${layer.transform.width / 2} ${
    layer.transform.height / 2
  }) scale(${scaleX} ${scaleY})`;
}

function renderLayer(layer: EditorLayer, isSelected: boolean, onPointerDown: React.PointerEventHandler) {
  const commonProps = {
    opacity: layer.opacity,
    style: { mixBlendMode: layer.blendMode },
    className: 'cursor-move',
    onPointerDown,
  };

  const { width, height } = layer.transform;

  switch (layer.type) {
    case 'rectangle':
      return (
        <rect
          {...commonProps}
          x={0}
          y={0}
          width={width}
          height={height}
          fill={layer.fill || '#e5e7eb'}
          stroke={layer.stroke?.color}
          strokeWidth={layer.stroke?.width ?? 0}
          strokeDasharray={layer.stroke?.dashArray?.join(' ')}
          rx={8}
          ry={8}
        />
      );
    case 'ellipse':
      return (
        <ellipse
          {...commonProps}
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={layer.fill || '#f1f5f9'}
          stroke={layer.stroke?.color}
          strokeWidth={layer.stroke?.width ?? 0}
          strokeDasharray={layer.stroke?.dashArray?.join(' ')}
        />
      );
    case 'image':
      return (
        <image
          {...commonProps}
          href={layer.assetUrl}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />
      );
    case 'text':
    default:
      return (
        <text
          {...commonProps}
          x={12}
          y={32}
          fontFamily={layer.font?.family || 'Inter, sans-serif'}
          fontSize={layer.font?.size || 18}
          fontWeight={layer.font?.weight || '600'}
          fill={layer.font?.color || '#0f172a'}
        >
          {layer.text || layer.name}
        </text>
      );
  }
}

export function Canvas() {
  const {
    slides,
    activeSlideId,
    selectedLayerId,
    setSelectedLayer,
    updateLayerTransform,
    zoom,
    setZoom,
    pan,
    setPan,
    snapToGrid,
    gridSize,
    toggleSnap,
  } = useEditor();
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const panOriginRef = useRef<Point | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const layers = useMemo(() => {
    const slide = activeSlideId ? slides[activeSlideId] : undefined;
    return (slide?.layers ?? []).filter((layer) => layer.visible !== false).sort((a, b) => a.zIndex - b.zIndex);
  }, [activeSlideId, slides]);

  const handleWheel: React.WheelEventHandler = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const nextZoom = Math.min(3, Math.max(0.25, zoom + delta));
    setZoom(Number(nextZoom.toFixed(2)));
  };

  const handleBackgroundPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return;
    setIsPanning(true);
    panOriginRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (dragRef.current) {
      const { layerId, startX, startY, originX, originY } = dragRef.current;
      const dx = (event.clientX - startX) / zoom;
      const dy = (event.clientY - startY) / zoom;

      const nextX = originX + dx;
      const nextY = originY + dy;
      const snappedX = snapToGrid ? Math.round(nextX / gridSize) * gridSize : nextX;
      const snappedY = snapToGrid ? Math.round(nextY / gridSize) * gridSize : nextY;

      updateLayerTransform(layerId, { x: snappedX, y: snappedY });
      return;
    }

    if (isPanning && panOriginRef.current) {
      const nextPan = { x: event.clientX - panOriginRef.current.x, y: event.clientY - panOriginRef.current.y };
      setPan(nextPan);
    }
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    dragRef.current = null;
    if (isPanning) {
      setIsPanning(false);
    }
    if (panOriginRef.current) {
      panOriginRef.current = null;
    }
    const element = event.currentTarget as Element;
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  const onLayerPointerDown = (layer: EditorLayer): React.PointerEventHandler => (event) => {
    event.stopPropagation();
    if (layer.locked) return;

    setSelectedLayer(layer.id);
    dragRef.current = {
      layerId: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: layer.transform.x,
      originY: layer.transform.y,
    };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  };

  const backgroundStyle: React.CSSProperties = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#f8fafc',
    backgroundImage:
      'linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px), ' +
      'linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)',
    backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold">Canvas</span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs">{(zoom * 100).toFixed(0)}%</span>
          <button
            type="button"
            className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            onClick={() => setZoom(1)}
          >
            Reset zoom
          </button>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input type="checkbox" checked={snapToGrid} onChange={toggleSnap} className="h-3 w-3" />
            Snap to grid ({gridSize}px)
          </label>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <button
            type="button"
            className="rounded bg-gray-100 px-2 py-1 font-semibold text-gray-700 transition hover:bg-gray-200"
            onClick={() => setZoom(clampZoom(zoom + 0.1))}
          >
            +
          </button>
          <button
            type="button"
            className="rounded bg-gray-100 px-2 py-1 font-semibold text-gray-700 transition hover:bg-gray-200"
            onClick={() => setZoom(clampZoom(zoom - 0.1))}
          >
            -
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-100"
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
          onPointerDown={handleBackgroundPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="presentation"
        >
          <div className="relative" style={backgroundStyle}>
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0">
              {layers.map((layer) => (
                <g
                  key={layer.id}
                  transform={layerTransform(layer)}
                  style={{ pointerEvents: layer.locked ? 'none' : 'auto' }}
                  opacity={layer.opacity}
                  className={selectedLayerId === layer.id ? 'drop-shadow-[0_0_0_2px_rgba(59,130,246,0.5)]' : ''}
                >
                  {renderLayer(layer, selectedLayerId === layer.id, onLayerPointerDown(layer))}
                  {selectedLayerId === layer.id ? (
                    <rect
                      x={-6}
                      y={-6}
                      width={layer.transform.width + 12}
                      height={layer.transform.height + 12}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      pointerEvents="none"
                    />
                  ) : null}
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function clampZoom(value: number) {
  return Math.min(3, Math.max(0.25, Number(value.toFixed(2))));
}

export default Canvas;
