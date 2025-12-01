import React, { useMemo } from 'react';
import { useEditor } from '../../state/editorSlice';
import type { EditorLayer } from '../../types/editor';

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        step={step}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (next: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="color"
        value={value || '#ffffff'}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-12 cursor-pointer rounded border border-gray-200 bg-white"
      />
      <input
        type="text"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

export function Inspector() {
  const { activeSlideId, slides, selectedLayerId, updateLayer, updateLayerTransform, setSelectedLayer } = useEditor();

  const layer = useMemo<EditorLayer | undefined>(() => {
    if (!activeSlideId) return undefined;
    const slide = slides[activeSlideId];
    return slide?.layers?.find((item) => item.id === selectedLayerId);
  }, [activeSlideId, selectedLayerId, slides]);

  if (!layer) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        <p className="font-semibold text-gray-900">Inspector</p>
        <p className="mt-2 text-sm">Select a layer to edit its properties.</p>
        <button
          type="button"
          className="mt-3 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          onClick={() => setSelectedLayer(slides[activeSlideId ?? '']?.layers?.[0]?.id)}
        >
          Jump to first layer
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Inspector</h3>
        <p className="text-xs text-gray-500">Edit properties for the selected layer.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="X" value={layer.transform.x} onChange={(value) => updateLayerTransform(layer.id, { x: value })} />
        <NumberInput label="Y" value={layer.transform.y} onChange={(value) => updateLayerTransform(layer.id, { y: value })} />
        <NumberInput label="Width" value={layer.transform.width} onChange={(value) => updateLayerTransform(layer.id, { width: value })} />
        <NumberInput label="Height" value={layer.transform.height} onChange={(value) => updateLayerTransform(layer.id, { height: value })} />
        <NumberInput label="Rotation" value={layer.transform.rotation ?? 0} onChange={(value) => updateLayerTransform(layer.id, { rotation: value })} />
        <NumberInput label="Opacity" value={layer.opacity} step={0.05} onChange={(value) => updateLayer(layer.id, { opacity: value })} />
      </div>

      <ColorInput label="Fill" value={layer.fill} onChange={(value) => updateLayer(layer.id, { fill: value })} />
      <ColorInput
        label="Stroke"
        value={layer.stroke?.color}
        onChange={(value) => updateLayer(layer.id, { stroke: { ...layer.stroke, color: value } })}
      />
      <NumberInput
        label="Stroke Width"
        value={layer.stroke?.width ?? 0}
        onChange={(value) => updateLayer(layer.id, { stroke: { ...layer.stroke, width: value } })}
      />

      {layer.type === 'text' ? (
        <>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Text</span>
            <textarea
              value={layer.text ?? ''}
              onChange={(event) => updateLayer(layer.id, { text: event.target.value })}
              className="min-h-[80px] rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Font Family</span>
            <input
              type="text"
              value={layer.font?.family ?? ''}
              onChange={(event) => updateLayer(layer.id, { font: { ...layer.font, family: event.target.value } })}
              className="rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              label="Font Size"
              value={layer.font?.size ?? 16}
              onChange={(value) => updateLayer(layer.id, { font: { ...layer.font, size: value } })}
            />
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weight</span>
              <input
                type="text"
                value={layer.font?.weight ?? ''}
                onChange={(event) => updateLayer(layer.id, { font: { ...layer.font, weight: event.target.value } })}
                className="rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Align</span>
              <select
                value={layer.font?.align ?? 'left'}
                onChange={(event) =>
                  updateLayer(layer.id, {
                    font: {
                      ...layer.font,
                      align: event.target.value as NonNullable<EditorLayer['font']>['align'],
                    },
                  })
                }
                className="rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </>
      ) : null}

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Blend Mode</span>
        <select
          value={layer.blendMode ?? 'normal'}
          onChange={(event) => updateLayer(layer.id, { blendMode: event.target.value as React.CSSProperties['mixBlendMode'] })}
          className="rounded border border-gray-200 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Shadow X"
          value={layer.effects?.shadowOffsetX ?? 0}
          onChange={(value) => updateLayer(layer.id, { effects: { ...layer.effects, shadowOffsetX: value } })}
        />
        <NumberInput
          label="Shadow Y"
          value={layer.effects?.shadowOffsetY ?? 0}
          onChange={(value) => updateLayer(layer.id, { effects: { ...layer.effects, shadowOffsetY: value } })}
        />
        <NumberInput
          label="Shadow Blur"
          value={layer.effects?.shadowBlur ?? 0}
          onChange={(value) => updateLayer(layer.id, { effects: { ...layer.effects, shadowBlur: value } })}
        />
        <ColorInput
          label="Shadow Color"
          value={layer.effects?.shadowColor}
          onChange={(value) => updateLayer(layer.id, { effects: { ...layer.effects, shadowColor: value } })}
        />
      </div>
    </div>
  );
}

export default Inspector;
