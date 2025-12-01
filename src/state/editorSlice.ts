import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { v4 as uuid } from 'uuid';
import {
  LayerStyle,
  LayerTransform,
  LayerType,
  Slide,
  SlideLayer,
} from '../api/models';

export interface SlideWithLayers extends Slide {
  layers: SlideLayer[];
}

export interface StoredAsset {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: number;
}

interface EditorState {
  slides: Record<string, SlideWithLayers>;
  activeSlideId?: string;
  selectedLayerId?: string;
  zoom: number;
  pan: { x: number; y: number };
  snapToGrid: boolean;
  gridSize: number;
  assets: StoredAsset[];
}

type EditorAction =
  | { type: 'setSlides'; slides: SlideWithLayers[]; activeSlideId?: string }
  | { type: 'setActiveSlide'; slideId: string }
  | { type: 'selectLayer'; layerId?: string }
  | { type: 'setZoom'; zoom: number }
  | { type: 'setPan'; pan: { x: number; y: number } }
  | { type: 'toggleSnap' }
  | { type: 'updateGridSize'; gridSize: number }
  | { type: 'addLayer'; layer: Partial<SlideLayer> & { type: LayerType } }
  | { type: 'updateLayer'; layerId: string; changes: Partial<SlideLayer> }
  | {
      type: 'updateLayerTransform';
      layerId: string;
      transform: Partial<LayerTransform>;
      snapToGrid: boolean;
      gridSize: number;
    }
  | { type: 'reorderLayers'; activeId: string; overId: string }
  | { type: 'setLayerVisibility'; layerId: string; visible: boolean }
  | { type: 'setLayerLock'; layerId: string; locked: boolean }
  | { type: 'registerAsset'; asset: StoredAsset };

interface EditorContextValue extends EditorState {
  activeSlide?: SlideWithLayers;
  selectedLayer?: SlideLayer;
  setSlides: (slides: SlideWithLayers[], activeSlideId?: string) => void;
  setActiveSlide: (slideId: string) => void;
  selectLayer: (layerId?: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (gridSize: number) => void;
  addLayer: (layer: Partial<SlideLayer> & { type: LayerType }) => void;
  updateLayer: (layerId: string, changes: Partial<SlideLayer>) => void;
  updateLayerTransform: (layerId: string, transform: Partial<LayerTransform>) => void;
  reorderLayers: (activeId: string, overId: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerLock: (layerId: string, locked: boolean) => void;
  registerAsset: (asset: StoredAsset) => void;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

const initialState: EditorState = {
  slides: {},
  zoom: 1,
  pan: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: 8,
  assets: [],
};

function normalizeLayers(layers: SlideLayer[]): SlideLayer[] {
  return [...layers]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer, index) => ({ ...layer, zIndex: index }));
}

function withActiveSlide(
  state: EditorState,
  updater: (slide: SlideWithLayers) => SlideWithLayers
): EditorState {
  const slideId = state.activeSlideId;
  if (!slideId) return state;
  const slide = state.slides[slideId];
  if (!slide) return state;
  const updatedSlide = updater(slide);
  return {
    ...state,
    slides: {
      ...state.slides,
      [slideId]: updatedSlide,
    },
  };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'setSlides': {
      const slides: Record<string, SlideWithLayers> = {};
      action.slides.forEach((slide) => {
        slides[slide.id] = {
          ...slide,
          layers: normalizeLayers(slide.layers ?? []),
        };
      });
      return {
        ...state,
        slides,
        activeSlideId:
          action.activeSlideId || state.activeSlideId || action.slides[0]?.id,
        selectedLayerId: undefined,
      };
    }
    case 'setActiveSlide': {
      const exists = state.slides[action.slideId];
      if (!exists) return state;
      return { ...state, activeSlideId: action.slideId, selectedLayerId: undefined };
    }
    case 'selectLayer':
      return { ...state, selectedLayerId: action.layerId };
    case 'setZoom':
      return { ...state, zoom: Math.min(Math.max(action.zoom, 0.25), 4) };
    case 'setPan':
      return { ...state, pan: action.pan };
    case 'toggleSnap':
      return { ...state, snapToGrid: !state.snapToGrid };
    case 'updateGridSize':
      return { ...state, gridSize: Math.max(2, Math.min(action.gridSize, 256)) };
    case 'addLayer':
      return withActiveSlide(state, (slide) => {
        const layer: SlideLayer = {
          id: action.layer.id ?? uuid(),
          name: action.layer.name ?? 'Layer',
          type: action.layer.type,
          zIndex: slide.layers.length,
          opacity: action.layer.opacity ?? 1,
          blendMode: action.layer.blendMode ?? 'normal',
          visible: action.layer.visible ?? true,
          locked: action.layer.locked ?? false,
          transform: action.layer.transform ?? {
            x: 0,
            y: 0,
            width: 120,
            height: 120,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
          style: action.layer.style ?? {},
          assetUrl: action.layer.assetUrl,
        };

        const layers = normalizeLayers([...slide.layers, layer]);
        return { ...slide, layers };
      });
    case 'updateLayer':
      return withActiveSlide(state, (slide) => {
        const layers = slide.layers.map((layer) =>
          layer.id === action.layerId ? { ...layer, ...action.changes } : layer
        );
        return { ...slide, layers: normalizeLayers(layers) };
      });
    case 'updateLayerTransform':
      return withActiveSlide(state, (slide) => {
        const layers = slide.layers.map((layer) => {
          if (layer.id !== action.layerId) return layer;
          const nextTransform = {
            ...layer.transform,
            ...action.transform,
          };
          const snappedTransform = action.snapToGrid
            ? {
                ...nextTransform,
                x: Math.round(nextTransform.x / action.gridSize) * action.gridSize,
                y: Math.round(nextTransform.y / action.gridSize) * action.gridSize,
                width:
                  Math.max(1, Math.round(nextTransform.width / action.gridSize)) *
                  action.gridSize,
                height:
                  Math.max(1, Math.round(nextTransform.height / action.gridSize)) *
                  action.gridSize,
              }
            : nextTransform;
          return { ...layer, transform: snappedTransform };
        });
        return { ...slide, layers: layers.map((layer) => ({ ...layer })) };
      });
    case 'reorderLayers':
      return withActiveSlide(state, (slide) => {
        const layers = normalizeLayers(slide.layers);
        const oldIndex = layers.findIndex((layer) => layer.id === action.activeId);
        const newIndex = layers.findIndex((layer) => layer.id === action.overId);
        if (oldIndex === -1 || newIndex === -1) return slide;
        const updated = [...layers];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        return { ...slide, layers: normalizeLayers(updated) };
      });
    case 'setLayerVisibility':
      return withActiveSlide(state, (slide) => ({
        ...slide,
        layers: slide.layers.map((layer) =>
          layer.id === action.layerId ? { ...layer, visible: action.visible } : layer
        ),
      }));
    case 'setLayerLock':
      return withActiveSlide(state, (slide) => ({
        ...slide,
        layers: slide.layers.map((layer) =>
          layer.id === action.layerId ? { ...layer, locked: action.locked } : layer
        ),
      }));
    case 'registerAsset':
      return {
        ...state,
        assets: [action.asset, ...state.assets.filter((item) => item.id !== action.asset.id)],
      };
    default:
      return state;
  }
}

export interface EditorProviderProps {
  children: React.ReactNode;
  initialSlides?: SlideWithLayers[];
  activeSlideId?: string;
}

export function EditorProvider({ children, initialSlides = [], activeSlideId }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    slides: Object.fromEntries(
      initialSlides.map((slide) => [slide.id, { ...slide, layers: normalizeLayers(slide.layers ?? []) }])
    ),
    activeSlideId: activeSlideId ?? initialSlides[0]?.id,
  });

  const value = useMemo<EditorContextValue>(() => {
    const activeSlide = state.activeSlideId ? state.slides[state.activeSlideId] : undefined;
    const selectedLayer = activeSlide?.layers.find((layer) => layer.id === state.selectedLayerId);

    return {
      ...state,
      activeSlide,
      selectedLayer,
      setSlides: (slides, activeId) => dispatch({ type: 'setSlides', slides, activeSlideId: activeId }),
      setActiveSlide: (slideId) => dispatch({ type: 'setActiveSlide', slideId }),
      selectLayer: (layerId) => dispatch({ type: 'selectLayer', layerId }),
      setZoom: (zoom) => dispatch({ type: 'setZoom', zoom }),
      setPan: (pan) => dispatch({ type: 'setPan', pan }),
      toggleSnapToGrid: () => dispatch({ type: 'toggleSnap' }),
      setGridSize: (gridSize) => dispatch({ type: 'updateGridSize', gridSize }),
      addLayer: (layer) => dispatch({ type: 'addLayer', layer }),
      updateLayer: (layerId, changes) => dispatch({ type: 'updateLayer', layerId, changes }),
      updateLayerTransform: (layerId, transform) =>
        dispatch({
          type: 'updateLayerTransform',
          layerId,
          transform,
          snapToGrid: state.snapToGrid,
          gridSize: state.gridSize,
        }),
      reorderLayers: (activeId, overId) => dispatch({ type: 'reorderLayers', activeId, overId }),
      setLayerVisibility: (layerId, visible) => dispatch({ type: 'setLayerVisibility', layerId, visible }),
      setLayerLock: (layerId, locked) => dispatch({ type: 'setLayerLock', layerId, locked }),
      registerAsset: (asset) => dispatch({ type: 'registerAsset', asset }),
    };
  }, [state]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorStore(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorStore must be used within an EditorProvider');
  }
  return context;
}

export function createDefaultLayer(type: LayerType, style: LayerStyle = {}): SlideLayer {
  return {
    id: uuid(),
    name: `${type} layer`,
    type,
    zIndex: 0,
    opacity: 1,
    blendMode: 'normal',
    visible: true,
    locked: false,
    transform: {
      x: 24,
      y: 24,
      width: 160,
      height: 160,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    style,
  };
}
