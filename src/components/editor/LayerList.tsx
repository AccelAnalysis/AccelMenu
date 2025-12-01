import React, { useMemo } from 'react';
import { useEditor } from '../../state/editorSlice';
import type { EditorLayer } from '../../types/editor';

function LayerItem({ layer }: { layer: EditorLayer }) {
  const {
    selectedLayerId,
    setSelectedLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    reorderLayer,
  } = useEditor();

  const isSelected = selectedLayerId === layer.id;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm transition ${
        isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'
      } ${layer.locked ? 'opacity-70' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedLayer(layer.id)}
      onKeyDown={(event) => event.key === 'Enter' && setSelectedLayer(layer.id)}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{layer.zIndex}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs font-semibold uppercase text-gray-600">
          {layer.type.slice(0, 2)}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{layer.name}</span>
          <span className="text-xs text-gray-500">{layer.type}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
          onClick={(event) => {
            event.stopPropagation();
            toggleLayerVisibility(layer.id);
          }}
        >
          {layer.visible ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
          onClick={(event) => {
            event.stopPropagation();
            toggleLayerLock(layer.id);
          }}
        >
          {layer.locked ? 'Unlock' : 'Lock'}
        </button>
        <div className="flex flex-col">
          <button
            type="button"
            aria-label="Move layer up"
            className="rounded bg-gray-100 px-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
            onClick={(event) => {
              event.stopPropagation();
              reorderLayer(layer.id, 'up');
            }}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move layer down"
            className="rounded bg-gray-100 px-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
            onClick={(event) => {
              event.stopPropagation();
              reorderLayer(layer.id, 'down');
            }}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}

export function LayerList() {
  const { activeSlideId, slides, addLayer } = useEditor();
  const layers = useMemo(() => {
    const slide = activeSlideId ? slides[activeSlideId] : undefined;
    return (slide?.layers ?? []).slice().sort((a, b) => b.zIndex - a.zIndex);
  }, [activeSlideId, slides]);

  const handleAddLayer = () => {
    addLayer({
      type: 'rectangle',
      name: `Layer ${layers.length + 1}`,
      fill: '#e2e8f0',
      transform: { x: 80, y: 80, width: 200, height: 140 },
    });
  };

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Layers</h3>
          <p className="text-xs text-gray-500">Reorder, hide, or lock layers for the active slide.</p>
        </div>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          onClick={handleAddLayer}
        >
          + Add Layer
        </button>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {layers.length === 0 ? (
          <p className="rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">No layers yet. Add one to start designing.</p>
        ) : (
          layers.map((layer) => <LayerItem key={layer.id} layer={layer} />)
        )}
      </div>
    </div>
  );
}

export default LayerList;
