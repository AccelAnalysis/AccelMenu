import type { EditorAsset, EditorLayer } from '../types/editor';

export interface Slide {
  id: string;
  slug: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  layout?: string;
  templateId?: string;
  position?: number;
  boardSlug: string;
  locationSlug: string;
  status: 'draft' | 'scheduled' | 'published';
  publishAt?: string | null;
  expireAt?: string | null;
  published: boolean;
  dirty: boolean;
  layers?: EditorLayer[];
  assets?: EditorAsset[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  layout: string;
  previewUrl?: string;
  layers?: EditorLayer[];
  assets?: EditorAsset[];
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

export interface SlideVersion {
  id: string;
  slideId: string;
  label: string;
  createdAt: string;
  author?: string;
  summary?: string;
  snapshot?: Slide;
}
