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
