export function buildLocationUrl(locationSlug: string): string {
  return `/locations/${locationSlug}`;
}

export function buildBoardUrl(locationSlug: string, boardSlug: string): string {
  return `/locations/${locationSlug}/boards/${boardSlug}`;
}

export function buildSlideUrl(
  locationSlug: string,
  boardSlug: string,
  slideSlug: string
): string {
  return `/locations/${locationSlug}/boards/${boardSlug}/slides/${slideSlug}`;
}
