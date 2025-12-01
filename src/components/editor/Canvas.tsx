import React, { useEffect, useMemo, useRef } from 'react';
import { SlideLayer } from '../../api/models';
import { useEditorStore } from '../../state/editorSlice';

interface DragState {
  layerId: string;
  startX: number;
  startY: number;
  initial: SlideLayer['transform'];
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

function LayerPreview({ layer }: { layer: SlideLayer }) {
  const { selectLayer, selectedLayerId, updateLayerTransform, zoom } = useEditorStore();
  const isSelected = selectedLayerId === layer.id;
  const dragState = useRef<DragState | null>(null);

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      if (!dragState.current) return;
      const { startX, startY, initial } = dragState.current;
      const dx = (event.clientX - startX) / zoom;
      const dy = (event.clientY - startY) / zoom;
      updateLayerTransform(layer.id, {
        x: initial.x + dx,
        y: initial.y + dy,
      });
    }

    function handleUp() {
      dragState.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [layer.id, updateLayerTransform]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (layer.locked) return;
    event.stopPropagation();
    selectLayer(layer.id);
    dragState.current = {
      layerId: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      initial: layer.transform,
    };
  };

  const style: React.CSSProperties = {
    left: layer.transform.x,
    top: layer.transform.y,
    width: layer.transform.width,
    height: layer.transform.height,
    transform: `rotate(${layer.transform.rotation}deg) scale(${layer.transform.scaleX}, ${layer.transform.scaleY})`,
    opacity: layer.opacity,
    mixBlendMode: layer.blendMode,
    border: isSelected ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.08)',
    boxShadow: layer.style?.shadow
      ? `${layer.style.shadow.offsetX}px ${layer.style.shadow.offsetY}px ${layer.style.shadow.blur}px ${layer.style.shadow.color}`
      : 'none',
    backgroundColor: layer.style?.fill || '#f8fafc',
    color: layer.style?.font?.color || '#0f172a',
    pointerEvents: layer.locked ? 'none' : 'auto',
  };

  const content = useMemo(() => {
    switch (layer.type) {
      case 'text':
        return (
          <div
            className="h-full w-full p-3"
            style={{
              fontFamily: layer.style?.font?.family,
              fontSize: layer.style?.font?.size,
              fontWeight: layer.style?.font?.weight,
              textAlign: layer.style?.font?.align,
              color: layer.style?.font?.color,
            }}
          >
            {layer.name}
          </div>
        );
      case 'image':
        return layer.assetUrl ? (
          <img
            src={layer.assetUrl}
            alt={layer.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
            Drop image
          </div>
        );
      default:
        return (
          <div className="h-full w-full" />
        );
    }
  }, [layer]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Layer ${layer.name}`}
      onMouseDown={handleMouseDown}
      className={`absolute overflow-hidden rounded ${layer.visible ? '' : 'opacity-40'} ${layer.locked ? 'pointer-events-none' : ''}`}
      style={style}
    >
      {content}
      {isSelected ? (
        <div className="pointer-events-none absolute inset-0 border-2 border-blue-500" aria-hidden />
      ) : null}
    </div>
  );
}

export function Canvas() {
  const { activeSlide, zoom, pan, setZoom, setPan, snapToGrid, gridSize, selectLayer } = useEditorStore();
  const viewportRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ startX: number; startY: number; originPan: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        event.preventDefault();
        const nextZoom = zoom + (event.deltaY > 0 ? -0.1 : 0.1);
        setZoom(nextZoom);
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [setZoom, zoom]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!panState.current) return;
      const { startX, startY, originPan } = panState.current;
      const nextPan = {
        x: originPan.x + (event.clientX - startX),
        y: originPan.y + (event.clientY - startY),
      };
      setPan(nextPan);
    };

    const handleUp = () => {
      panState.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [setPan]);

  const startPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 1 && !event.shiftKey) return;
    event.preventDefault();
    panState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originPan: pan,
    };
  };

  const handleBackgroundClick = () => selectLayer(undefined);

  const sortedLayers = useMemo(() => {
    if (!activeSlide) return [] as SlideLayer[];
    return [...(activeSlide.layers ?? [])].sort((a, b) => a.zIndex - b.zIndex);
  }, [activeSlide]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold">Canvas</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Snap {snapToGrid ? `on (${gridSize}px)` : 'off'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-gray-200 px-2 py-1 text-sm"
            onClick={() => setZoom(zoom - 0.1)}
          >
            -
          </button>
          <span className="min-w-[60px] text-center text-sm font-semibold text-gray-800">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            type="button"
            className="rounded border border-gray-200 px-2 py-1 text-sm"
            onClick={() => setZoom(zoom + 0.1)}
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative flex min-h-[480px] flex-1 items-center justify-center overflow-hidden rounded-md bg-gray-100"
        onMouseDown={startPan}
        onClick={handleBackgroundClick}
      >
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div
          className="relative shadow-lg"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {sortedLayers.map((layer) => (
              <LayerPreview key={layer.id} layer={layer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Canvas;
