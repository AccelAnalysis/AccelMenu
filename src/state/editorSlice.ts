import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { Slide } from '../api/models';
import type { EditorAsset, EditorLayer, LayerType } from '../types/editor';

interface Point {
  x: number;
  y: number;
}

interface EditorState {
  slides: Record<string, Slide>;
  activeSlideId?: string;
  selectedLayerId?: string;
  zoom: number;
  pan: Point;
  snapToGrid: boolean;
  gridSize: number;
  assets: EditorAsset[];
}

type EditorAction =
  | { type: 'setActiveSlide'; slide: Slide }
  | { type: 'selectLayer'; layerId?: string }
  | { type: 'addLayer'; layer: EditorLayer }
  | { type: 'updateLayer'; layerId: string; updates: Partial<EditorLayer> }
  | { type: 'updateLayerTransform'; layerId: string; updates: Partial<EditorLayer['transform']> }
  | { type: 'reorderLayer'; layerId: string; direction: 'up' | 'down' }
  | { type: 'toggleVisibility'; layerId: string }
  | { type: 'toggleLock'; layerId: string }
  | { type: 'setZoom'; zoom: number }
  | { type: 'setPan'; pan: Point }
  | { type: 'toggleSnap' }
  | { type: 'addAsset'; asset: EditorAsset };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function sortByZIndex(layers: EditorLayer[]) {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

function updateSlide(
  state: EditorState,
  updater: (slide: Slide) => Slide,
  fallbackState: EditorState = state
): EditorState {
  const { activeSlideId } = state;
  if (!activeSlideId) return fallbackState;
  const slide = state.slides[activeSlideId];
  if (!slide) return fallbackState;

  const updated = updater(slide);
  return {
    ...state,
    slides: {
      ...state.slides,
      [activeSlideId]: { ...updated, dirty: true },
    },
  };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'setActiveSlide': {
      const slide = action.slide;
      return {
        ...state,
        slides: { ...state.slides, [slide.id]: slide },
        activeSlideId: slide.id,
        selectedLayerId: slide.layers?.[0]?.id ?? undefined,
        assets: slide.assets ?? state.assets,
      };
    }
    case 'selectLayer': {
      return { ...state, selectedLayerId: action.layerId };
    }
    case 'addLayer': {
      return updateSlide(state, (slide) => {
        const layers = slide.layers ?? [];
        return {
          ...slide,
          layers: sortByZIndex([...layers, action.layer]),
        };
      });
    }
    case 'updateLayer': {
      return updateSlide(state, (slide) => {
        const layers = slide.layers ?? [];
        return {
          ...slide,
          layers: layers.map((layer) =>
            layer.id === action.layerId ? { ...layer, ...action.updates } : layer
          ),
        };
      });
    }
    case 'updateLayerTransform': {
      return updateSlide(state, (slide) => {
        const layers = slide.layers ?? [];
        return {
          ...slide,
          layers: layers.map((layer) =>
            layer.id === action.layerId
              ? { ...layer, transform: { ...layer.transform, ...action.updates } }
              : layer
          ),
        };
      });
    }
    case 'reorderLayer': {
      return updateSlide(state, (slide) => {
        const layers = sortByZIndex(slide.layers ?? []);
        const index = layers.findIndex((layer) => layer.id === action.layerId);
        if (index === -1) return slide;
        const swapIndex = action.direction === 'up' ? index + 1 : index - 1;
        if (swapIndex < 0 || swapIndex >= layers.length) return slide;

        const updated = [...layers];
        const tempZ = updated[index].zIndex;
        updated[index] = { ...updated[index], zIndex: updated[swapIndex].zIndex };
        updated[swapIndex] = { ...updated[swapIndex], zIndex: tempZ };

        return { ...slide, layers: sortByZIndex(updated) };
      });
    }
    case 'toggleVisibility': {
      return updateSlide(state, (slide) => ({
        ...slide,
        layers: (slide.layers ?? []).map((layer) =>
          layer.id === action.layerId ? { ...layer, visible: !layer.visible } : layer
        ),
      }));
    }
    case 'toggleLock': {
      return updateSlide(state, (slide) => ({
        ...slide,
        layers: (slide.layers ?? []).map((layer) =>
          layer.id === action.layerId ? { ...layer, locked: !layer.locked } : layer
        ),
      }));
    }
    case 'setZoom': {
      return { ...state, zoom: clamp(action.zoom, 0.25, 3) };
    }
    case 'setPan': {
      return { ...state, pan: action.pan };
    }
    case 'toggleSnap': {
      return { ...state, snapToGrid: !state.snapToGrid };
    }
    case 'addAsset': {
      return { ...state, assets: [...state.assets, action.asset] };
    }
    default:
      return state;
  }
}

export interface EditorProviderProps {
  children: React.ReactNode;
  initialSlides?: Slide[];
  gridSize?: number;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export function EditorProvider({ children, initialSlides = [], gridSize = 10 }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    slides: initialSlides.reduce<Record<string, Slide>>((acc, slide) => {
      acc[slide.id] = slide;
      return acc;
    }, {}),
    activeSlideId: initialSlides[0]?.id,
    selectedLayerId: initialSlides[0]?.layers?.[0]?.id,
    zoom: 1,
    pan: { x: 0, y: 0 },
    snapToGrid: true,
    gridSize,
    assets: initialSlides[0]?.assets ?? [],
  });

  const value = useMemo<EditorContextValue>(() => {
    const activeSlide = state.activeSlideId ? state.slides[state.activeSlideId] : undefined;
    const layers = activeSlide?.layers ?? [];
    const nextZIndex = layers.length ? Math.max(...layers.map((layer) => layer.zIndex)) + 1 : 1;

    return {
      ...state,
      setActiveSlide: (slide) => dispatch({ type: 'setActiveSlide', slide }),
      setSelectedLayer: (layerId) => dispatch({ type: 'selectLayer', layerId }),
      addLayer: (partialLayer) => {
        if (!state.activeSlideId) return;
        const layer: EditorLayer = {
          id: partialLayer.id ?? `layer-${Date.now()}`,
          name: partialLayer.name ?? 'Layer',
          type: partialLayer.type,
          zIndex: partialLayer.zIndex ?? nextZIndex,
          opacity: partialLayer.opacity ?? 1,
          blendMode: partialLayer.blendMode ?? 'normal',
          visible: partialLayer.visible ?? true,
          locked: partialLayer.locked ?? false,
          transform: partialLayer.transform ?? {
            x: 100,
            y: 100,
            width: 200,
            height: 120,
          },
          fill: partialLayer.fill ?? '#ffffff',
          stroke: partialLayer.stroke,
          font: partialLayer.font,
          effects: partialLayer.effects,
          assetUrl: partialLayer.assetUrl,
          text: partialLayer.text,
        };
        dispatch({ type: 'addLayer', layer });
        dispatch({ type: 'selectLayer', layerId: layer.id });
      },
      updateLayer: (layerId, updates) => dispatch({ type: 'updateLayer', layerId, updates }),
      updateLayerTransform: (layerId, updates) =>
        dispatch({ type: 'updateLayerTransform', layerId, updates }),
      reorderLayer: (layerId, direction) =>
        dispatch({ type: 'reorderLayer', layerId, direction }),
      toggleLayerVisibility: (layerId) => dispatch({ type: 'toggleVisibility', layerId }),
      toggleLayerLock: (layerId) => dispatch({ type: 'toggleLock', layerId }),
      setZoom: (zoom) => dispatch({ type: 'setZoom', zoom }),
      setPan: (pan) => dispatch({ type: 'setPan', pan }),
      toggleSnap: () => dispatch({ type: 'toggleSnap' }),
      addAsset: (asset) => dispatch({ type: 'addAsset', asset }),
    };
  }, [state]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export interface EditorContextValue extends EditorState {
  setActiveSlide: (slide: Slide) => void;
  setSelectedLayer: (layerId?: string) => void;
  addLayer: (layer: Partial<EditorLayer> & { type: LayerType; id?: string }) => void;
  updateLayer: (layerId: string, updates: Partial<EditorLayer>) => void;
  updateLayerTransform: (layerId: string, updates: Partial<EditorLayer['transform']>) => void;
  reorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  toggleSnap: () => void;
  addAsset: (asset: EditorAsset) => void;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
