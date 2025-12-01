import type React from "react";
export type LayerType = 'rectangle' | 'ellipse' | 'text' | 'image';

export interface LayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface LayerFont {
  family?: string;
  size?: number;
  weight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export interface LayerStroke {
  color?: string;
  width?: number;
  dashArray?: number[];
}

export interface LayerEffects {
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface EditorLayer {
  id: string;
  name: string;
  type: LayerType;
  zIndex: number;
  opacity: number;
  blendMode?: React.CSSProperties['mixBlendMode'];
  visible: boolean;
  locked: boolean;
  transform: LayerTransform;
  fill?: string;
  stroke?: LayerStroke;
  font?: LayerFont;
  effects?: LayerEffects;
  assetUrl?: string;
  text?: string;
}

export interface EditorAsset {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}
