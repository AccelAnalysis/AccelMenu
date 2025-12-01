import { Location, MenuBoard, Slide } from './models';

const API_BASE = '/api';
const slideCache = new Map<string, Slide[]>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function cacheSlides(locationSlug: string, boardSlug: string, slides: Slide[]): void {
  const cacheKey = `${locationSlug}/${boardSlug}`;
  slideCache.set(cacheKey, slides);
}

export function getCachedSlides(locationSlug: string, boardSlug: string): Slide[] | undefined {
  const cacheKey = `${locationSlug}/${boardSlug}`;
  return slideCache.get(cacheKey);
}

export function clearSlideCache(locationSlug?: string, boardSlug?: string): void {
  if (locationSlug && boardSlug) {
    slideCache.delete(`${locationSlug}/${boardSlug}`);
    return;
  }
  slideCache.clear();
}

export async function getLocations(): Promise<Location[]> {
  const locations = await fetchJson<Location[]>('/locations');
  return locations.map((location) => ({
    ...location,
    boards: location.boards ?? [],
  }));
}

export async function getBoardsForLocation(locationSlug: string): Promise<MenuBoard[]> {
  const boards = await fetchJson<MenuBoard[]>(`/locations/${locationSlug}/boards`);
  return boards.map((board) => ({
    ...board,
    slug: board.slug ?? board.boardSlug,
    boardSlug: board.boardSlug ?? board.slug,
    locationSlug: board.locationSlug ?? locationSlug,
    slides: board.slides ?? [],
  }));
}

interface SlideOptions {
  useCache?: boolean;
}

export async function getSlidesForBoard(
  locationSlug: string,
  boardSlug: string,
  options: SlideOptions = { useCache: true }
): Promise<Slide[]> {
  const cacheKey = `${locationSlug}/${boardSlug}`;
  const shouldUseCache = options.useCache ?? true;

  if (shouldUseCache && slideCache.has(cacheKey)) {
    return slideCache.get(cacheKey)!;
  }

  const slides = await fetchJson<Slide[]>(`/locations/${locationSlug}/boards/${boardSlug}/slides`);
  cacheSlides(locationSlug, boardSlug, slides);
  return slides;
}

export async function getBoardWithSlides(
  locationSlug: string,
  boardSlug: string,
  options: SlideOptions = { useCache: true }
): Promise<MenuBoard | null> {
  const boards = await getBoardsForLocation(locationSlug);
  const board = boards.find(
    (entry) => entry.boardSlug === boardSlug || entry.slug === boardSlug
  );

  if (!board) return null;

  const targetBoardSlug = board.boardSlug ?? boardSlug;
  const slides = await getSlidesForBoard(locationSlug, targetBoardSlug, options);
  return {
    ...board,
    boardSlug: targetBoardSlug,
    slides,
  };
}

export async function refreshBoardSlides(locationSlug: string, boardSlug: string): Promise<Slide[]> {
  clearSlideCache(locationSlug, boardSlug);
  return getSlidesForBoard(locationSlug, boardSlug, { useCache: false });
}
