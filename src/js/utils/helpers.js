import { APP_CONSTANTS } from './constants.js';

/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 */
export const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Generates a unique ID for tiles
 * @returns {string} A unique ID
 */
export const generateId = () => {
  return 'tile-' + Math.random().toString(36).substr(2, 9);
};

/**
 * Validates if a position object has valid coordinates and dimensions
 * @param {Object} position - The position object to validate
 * @returns {boolean} True if position is valid
 */
export const isValidPosition = (position) => {
  if (!position) return false;
  const { x, y, width, height } = position;
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof width === 'number' &&
    typeof height === 'number' &&
    width > 0 &&
    height > 0
  );
};

/**
 * Snaps a value to the nearest grid point
 * @param {number} value - The value to snap
 * @param {number} [gridSize=APP_CONSTANTS.GRID_SIZE] - The grid size to snap to
 * @returns {number} The snapped value
 */
export const snapToGrid = (value, gridSize = APP_CONSTANTS.GRID_SIZE) => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Clamps a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} The clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Deep clones an object
 * @param {Object} obj - The object to clone
 * @returns {Object} A deep clone of the object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
