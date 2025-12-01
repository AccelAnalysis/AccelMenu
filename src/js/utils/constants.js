// Tile types
export const TILE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  LOTTIE: 'lottie'
};

// Default tile dimensions
export const DEFAULT_TILE = {
  width: 200,
  height: 150,
  x: 0,
  y: 0
};

// Application constants
export const APP_CONSTANTS = {
  GRID_SIZE: 10, // Grid snapping size in pixels
  MIN_TILE_SIZE: 50, // Minimum tile size in pixels
  MAX_TILE_SIZE: 500, // Maximum tile size in pixels
  Z_INDEX_BASE: 1, // Base z-index for tiles
  Z_INDEX_ACTIVE: 1000 // z-index for active tile
};
