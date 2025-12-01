import type { CSSProperties } from 'react';

export interface Slide {
  id: string;
  slug: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  layout?: string;
  position?: number;
  boardSlug: string;
  locationSlug: string;
  published: boolean;
  dirty: boolean;
  layers?: SlideLayer[];
}

export type LayerType = 'shape' | 'text' | 'image' | 'group';

export interface LayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface LayerFontStyle {
  family: string;
  size: number;
  weight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface LayerShadowStyle {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface LayerStyle {
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  font?: LayerFontStyle;
  shadow?: LayerShadowStyle;
}

export interface SlideLayer {
  id: string;
  name: string;
  type: LayerType;
  zIndex: number;
  opacity: number;
  blendMode?: CSSProperties['mixBlendMode'];
  visible: boolean;
  locked: boolean;
  transform: LayerTransform;
  style?: LayerStyle;
  assetUrl?: string;
}

export interface MenuBoard {
  id: string;
  slug: string;
  name: string;
  boardSlug: string;
  locationSlug: string;
  slides: Slide[];
  published: boolean;
  dirty: boolean;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  boards: MenuBoard[];
  published: boolean;
  dirty: boolean;
}

export interface SlideStackCacheEntry {
  locationSlug: string;
  boardSlug: string;
  slides: Slide[];
  updatedAt: number;
}
