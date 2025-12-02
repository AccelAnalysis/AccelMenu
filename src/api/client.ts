import { Location, MenuBoard, Slide, SlideVersion, Template } from './models';

const API_BASE = '/api';
const slideCache = new Map<string, Slide[]>();
const templateStore: Template[] = [
  {
    id: 'template-classic',
    name: 'Classic Menu',
    description: 'Balanced layout with hero image and feature cards.',
    layout: 'classic',
    previewUrl: 'https://placehold.co/320x180?text=Classic',
  },
  {
    id: 'template-highlight',
    name: 'Highlight',
    description: 'Large header image with supporting detail blocks.',
    layout: 'highlight',
    previewUrl: 'https://placehold.co/320x180?text=Highlight',
  },
];

const versionStore: Record<string, SlideVersion[]> = {};

function normalizeSlide(slide: Slide): Slide {
  const status = slide.status ?? (slide.published ? 'published' : 'draft');
  return {
    publishAt: slide.publishAt ?? null,
    expireAt: slide.expireAt ?? null,
    ...slide,
    status,
    published: slide.published ?? status === 'published',
  };
}

function normalizeSlides(slides: Slide[]): Slide[] {
  return slides.map(normalizeSlide);
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function simulateNetworkLatency<T>(response: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(response), delayMs));
}

function updateCachedSlides(
  locationSlug: string,
  boardSlug: string,
  updater: (slides: Slide[]) => Slide[]
) {
  const cacheKey = `${locationSlug}/${boardSlug}`;
  const currentSlides = slideCache.get(cacheKey) ?? [];
  const normalizedCurrent = normalizeSlides(currentSlides);
  const nextSlides = normalizeSlides(updater(normalizedCurrent));
  slideCache.set(cacheKey, nextSlides);

  return { previous: normalizedCurrent, updated: nextSlides };
}

export function cacheSlides(locationSlug: string, boardSlug: string, slides: Slide[]): void {
  const cacheKey = `${locationSlug}/${boardSlug}`;
  slideCache.set(cacheKey, normalizeSlides(slides));
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

function ensureVersionSeed(slideId: string) {
  if (!versionStore[slideId]) {
    const createdAt = new Date().toISOString();
    versionStore[slideId] = [
      {
        id: `${slideId}-v1`,
        slideId,
        label: 'Initial version',
        createdAt,
        author: 'System',
        summary: 'Imported from source of truth',
        snapshot: {
          id: slideId,
          slug: slideId,
          title: 'Untitled slide',
          description: 'Seeded slide version',
          layout: 'default',
          boardSlug: 'unknown',
          locationSlug: 'unknown',
          status: 'draft',
          publishAt: null,
          expireAt: null,
          published: false,
          dirty: false,
        },
      },
    ];
  }
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
    slides: board.slides ? normalizeSlides(board.slides) : [],
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
  const normalized = normalizeSlides(slides);
  cacheSlides(locationSlug, boardSlug, normalized);
  return normalized;
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

export async function listTemplates(): Promise<Template[]> {
  return Promise.resolve([...templateStore]);
}

export async function saveTemplate(template: Template): Promise<Template> {
  const existingIndex = templateStore.findIndex((entry) => entry.id === template.id);
  const payload = { ...template, id: template.id ?? `template-${Date.now()}` };

  if (existingIndex >= 0) {
    templateStore.splice(existingIndex, 1, payload);
  } else {
    templateStore.push(payload);
  }

  return Promise.resolve(payload);
}

export async function listVersions(slideId: string): Promise<SlideVersion[]> {
  ensureVersionSeed(slideId);
  return Promise.resolve(versionStore[slideId]);
}

export async function restoreVersion(slideId: string, versionId: string): Promise<Slide> {
  ensureVersionSeed(slideId);
  const versions = versionStore[slideId];
  const target = versions.find((version) => version.id === versionId);

  if (!target?.snapshot) {
    throw new Error(`Version ${versionId} not found for slide ${slideId}`);
  }

  const restored: Slide = {
    ...target.snapshot,
    id: slideId,
    dirty: true,
  };

  const restoredVersion: SlideVersion = {
    id: `${slideId}-restored-${Date.now()}`,
    slideId,
    label: `Restored ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    author: 'You',
    summary: `Restored from ${target.label}`,
    snapshot: restored,
  };

  versionStore[slideId] = [restoredVersion, ...versions];
  return Promise.resolve(restored);
}

export async function updateSlideSchedule(
  locationSlug: string,
  boardSlug: string,
  slideId: string,
  updates: Partial<Pick<Slide, 'status' | 'publishAt' | 'expireAt'>>
): Promise<Slide> {
  const { previous, updated } = updateCachedSlides(locationSlug, boardSlug, (slides) =>
    slides.map((slide) => {
      if (slide.id !== slideId) return slide;

      const nextStatus = updates.status ?? slide.status ?? 'draft';
      const publishAt =
        'publishAt' in updates ? updates.publishAt ?? null : slide.publishAt ?? null;
      const expireAt = 'expireAt' in updates ? updates.expireAt ?? null : slide.expireAt ?? null;

      return normalizeSlide({
        ...slide,
        ...updates,
        status: nextStatus,
        publishAt,
        expireAt,
        published: nextStatus === 'published',
      });
    })
  );

  const updatedSlide = updated.find((slide) => slide.id === slideId);
  if (!updatedSlide) {
    throw new Error(`Slide ${slideId} not found on board ${boardSlug}`);
  }

  try {
    await simulateNetworkLatency(updatedSlide);
    return updatedSlide;
  } catch (error) {
    cacheSlides(locationSlug, boardSlug, previous);
    throw error;
  }
}

export async function publishBoard(
  locationSlug: string,
  boardSlug: string,
  publishedAt: string = new Date().toISOString()
): Promise<Slide[]> {
  const { previous, updated } = updateCachedSlides(locationSlug, boardSlug, (slides) =>
    slides.map((slide) =>
      normalizeSlide({
        ...slide,
        status: 'published',
        publishAt: slide.publishAt ?? publishedAt,
        published: true,
        dirty: false,
      })
    )
  );

  try {
    await simulateNetworkLatency(updated);
    return updated;
  } catch (error) {
    cacheSlides(locationSlug, boardSlug, previous);
    throw error;
  }
}

export async function revertBoard(
  locationSlug: string,
  boardSlug: string
): Promise<Slide[]> {
  const { previous, updated } = updateCachedSlides(locationSlug, boardSlug, (slides) =>
    slides.map((slide) =>
      normalizeSlide({
        ...slide,
        status: 'draft',
        publishAt: null,
        expireAt: null,
        published: false,
        dirty: false,
      })
    )
  );

  try {
    await simulateNetworkLatency(updated);
    return updated;
  } catch (error) {
    cacheSlides(locationSlug, boardSlug, previous);
    throw error;
  }
}

export async function deleteBoard(locationSlug: string, boardSlug: string): Promise<void> {
  clearSlideCache(locationSlug, boardSlug);
  await simulateNetworkLatency(true, 120);
}
