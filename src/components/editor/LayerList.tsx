import React, { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SlideLayer } from '../../api/models';
import { useEditorStore } from '../../state/editorSlice';

interface SortableLayerProps {
  layer: SlideLayer;
  selected: boolean;
  onToggleVisibility: (layerId: string, visible: boolean) => void;
  onToggleLock: (layerId: string, locked: boolean) => void;
  onSelect: (layerId: string) => void;
}

function SortableLayer({ layer, selected, onToggleLock, onToggleVisibility, onSelect }: SortableLayerProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded border px-2 py-1 text-sm shadow-sm transition ${
        selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
      } ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
    >
      <button
        type="button"
        aria-label="Reorder layer"
        className="cursor-grab rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600"
        {...attributes}
        {...listeners}
      >
        ↕
      </button>
      <div className="flex flex-1 items-center gap-2" onClick={() => onSelect(layer.id)}>
        <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-xs font-bold text-gray-600">
          {layer.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{layer.name}</span>
          <span className="text-xs text-gray-500">{layer.type}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
          className={`rounded px-2 py-1 text-xs font-semibold ${
            layer.visible ? 'text-gray-700 hover:bg-gray-100' : 'text-amber-700 hover:bg-amber-50'
          }`}
          onClick={() => onToggleVisibility(layer.id, !layer.visible)}
        >
          {layer.visible ? '👁' : '🚫'}
        </button>
        <button
          type="button"
          aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
          className={`rounded px-2 py-1 text-xs font-semibold ${
            layer.locked ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onToggleLock(layer.id, !layer.locked)}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
}

export function LayerList() {
  const {
    activeSlide,
    selectedLayerId,
    selectLayer,
    setLayerVisibility,
    setLayerLock,
    reorderLayers,
  } = useEditorStore();
  const layers = useMemo(
    () =>
      (activeSlide?.layers ?? [])
        .slice()
        .sort((a, b) => b.zIndex - a.zIndex),
    [activeSlide]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderLayers(String(active.id), String(over.id));
    }
  };

  if (!activeSlide) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">Layers</h3>
        <p className="text-sm text-gray-600">Select a slide to start editing layers.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Layers</h3>
        <span className="text-xs text-gray-500">{layers.length} items</span>
      </div>
      {layers.length === 0 ? (
        <p className="text-sm text-gray-600">No layers yet. Add one from the inspector.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={layers.map((layer) => layer.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {layers.map((layer) => (
                <SortableLayer
                  key={layer.id}
                  layer={layer}
                  selected={selectedLayerId === layer.id}
                  onSelect={selectLayer}
                  onToggleLock={setLayerLock}
                  onToggleVisibility={setLayerVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default LayerList;
