import React, { useMemo, useState } from 'react';
import { LayerStyle, LayerType } from '../../api/models';
import { createDefaultLayer, useEditorStore } from '../../state/editorSlice';

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

export function Inspector() {
  const {
    activeSlide,
    selectedLayer,
    addLayer,
    updateLayer,
    updateLayerTransform,
    selectLayer,
  } = useEditorStore();
  const [newLayerType, setNewLayerType] = useState<LayerType>('shape');

  const canAddLayer = Boolean(activeSlide);

  const addNewLayer = () => {
    if (!activeSlide) return;
    const layer = createDefaultLayer(newLayerType);
    addLayer(layer);
    selectLayer(layer.id);
  };

  const updateStyle = (changes: Partial<LayerStyle>) => {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, {
      style: { ...selectedLayer.style, ...changes },
    });
  };

  const updateFont = (changes: LayerStyle['font']) => {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, {
      style: {
        ...selectedLayer.style,
        font: {
          ...selectedLayer.style?.font,
          ...changes,
        },
      },
    });
  };

  const updateShadow = (changes: LayerStyle['shadow']) => {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, {
      style: {
        ...selectedLayer.style,
        shadow: {
          ...selectedLayer.style?.shadow,
          ...changes,
        },
      },
    });
  };

  const transform = selectedLayer?.transform;

  const blendModes = useMemo(
    () => ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'],
    []
  );

  if (!activeSlide) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">Inspector</h3>
        <p className="text-sm text-gray-600">Select a slide to view properties.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Inspector</p>
          <p className="text-xs text-gray-500">
            {selectedLayer ? `Editing ${selectedLayer.name}` : 'Select a layer to edit.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-gray-200 px-2 py-1 text-sm"
            value={newLayerType}
            onChange={(event) => setNewLayerType(event.target.value as LayerType)}
          >
            <option value="shape">Shape</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
          </select>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={!canAddLayer}
            onClick={addNewLayer}
          >
            Add layer
          </button>
        </div>
      </div>

      {!selectedLayer ? (
        <p className="text-sm text-gray-600">Select a layer from the list to edit its properties.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="X"
              value={transform?.x ?? 0}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { x: value })}
            />
            <NumberInput
              label="Y"
              value={transform?.y ?? 0}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { y: value })}
            />
            <NumberInput
              label="Width"
              value={transform?.width ?? 0}
              min={4}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { width: value })}
            />
            <NumberInput
              label="Height"
              value={transform?.height ?? 0}
              min={4}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { height: value })}
            />
            <NumberInput
              label="Rotation"
              value={transform?.rotation ?? 0}
              step={1}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { rotation: value })}
            />
            <NumberInput
              label="Scale X"
              value={transform?.scaleX ?? 1}
              step={0.1}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { scaleX: value })}
            />
            <NumberInput
              label="Scale Y"
              value={transform?.scaleY ?? 1}
              step={0.1}
              onChange={(value) => selectedLayer && updateLayerTransform(selectedLayer.id, { scaleY: value })}
            />
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Blend mode
              <select
                value={selectedLayer.blendMode ?? 'normal'}
                onChange={(event) =>
                  updateLayer(selectedLayer.id, { blendMode: event.target.value })
                }
                className="rounded border border-gray-200 px-2 py-1 text-sm"
              >
                {blendModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Fill
              <input
                type="color"
                value={selectedLayer.style?.fill ?? '#ffffff'}
                onChange={(event) => updateStyle({ fill: event.target.value })}
                className="h-10 w-full cursor-pointer rounded border border-gray-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Stroke color
              <input
                type="color"
                value={selectedLayer.style?.strokeColor ?? '#000000'}
                onChange={(event) => updateStyle({ strokeColor: event.target.value })}
                className="h-10 w-full cursor-pointer rounded border border-gray-200"
              />
            </label>
            <NumberInput
              label="Stroke width"
              value={selectedLayer.style?.strokeWidth ?? 0}
              min={0}
              step={0.5}
              onChange={(value) => updateStyle({ strokeWidth: value })}
            />
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Opacity
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedLayer.opacity}
                onChange={(event) => updateLayer(selectedLayer.id, { opacity: Number(event.target.value) })}
              />
            </label>
          </div>

          {selectedLayer.type === 'text' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                Font family
                <input
                  type="text"
                  value={selectedLayer.style?.font?.family ?? 'Inter'}
                  onChange={(event) => updateFont({ family: event.target.value })}
                  className="rounded border border-gray-200 px-2 py-1 text-sm"
                />
              </label>
              <NumberInput
                label="Font size"
                value={selectedLayer.style?.font?.size ?? 16}
                min={8}
                onChange={(value) => updateFont({ size: value })}
              />
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                Weight
                <input
                  type="text"
                  value={selectedLayer.style?.font?.weight ?? '600'}
                  onChange={(event) => updateFont({ weight: event.target.value })}
                  className="rounded border border-gray-200 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                Align
                <select
                  value={selectedLayer.style?.font?.align ?? 'left'}
                  onChange={(event) => updateFont({ align: event.target.value as any })}
                  className="rounded border border-gray-200 px-2 py-1 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Shadow color
              <input
                type="color"
                value={selectedLayer.style?.shadow?.color ?? '#000000'}
                onChange={(event) => updateShadow({ color: event.target.value })}
                className="h-10 w-full cursor-pointer rounded border border-gray-200"
              />
            </label>
            <NumberInput
              label="Shadow blur"
              value={selectedLayer.style?.shadow?.blur ?? 0}
              min={0}
              onChange={(value) => updateShadow({ blur: value })}
            />
            <NumberInput
              label="Shadow X"
              value={selectedLayer.style?.shadow?.offsetX ?? 0}
              onChange={(value) => updateShadow({ offsetX: value })}
            />
            <NumberInput
              label="Shadow Y"
              value={selectedLayer.style?.shadow?.offsetY ?? 0}
              onChange={(value) => updateShadow({ offsetY: value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Inspector;
