import { v4 as uuidv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/dist/esm-browser/index.js';

class AppState {
  constructor() {
    this.state = {
      locations: {},
      currentLocationId: null,
      currentBoardId: null,
      currentSlideIndex: 0,
      editing: false,
      activeTileId: null
    };
    
    // Initialize with a default location and board if none exists
    this.initializeDefaultState();
  }

  /**
   * Initialize default state with a sample location and board
   */
  initializeDefaultState() {
    if (Object.keys(this.state.locations).length === 0) {
      const locationId = this.addLocation('Default Location');
      this.state.currentLocationId = locationId;
      
      const boardId = this.addBoard(locationId, 'Main Board');
      this.state.currentBoardId = boardId;
      
      // Add a default slide
      this.addSlide(locationId, boardId, 'Main Menu');
    }
  }

  // Location methods
  addLocation(name) {
    const locationId = `loc_${uuidv4()}`;
    this.state.locations[locationId] = {
      id: locationId,
      name,
      boards: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return locationId;
  }

  updateLocation(locationId, updates) {
    if (this.state.locations[locationId]) {
      this.state.locations[locationId] = {
        ...this.state.locations[locationId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  // Board methods
  addBoard(locationId, name) {
    if (!this.state.locations[locationId]) return null;
    
    const boardId = `brd_${uuidv4()}`;
    this.state.locations[locationId].boards[boardId] = {
      id: boardId,
      name,
      slides: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return boardId;
  }

  updateBoard(locationId, boardId, updates) {
    const location = this.state.locations[locationId];
    if (location && location.boards[boardId]) {
      location.boards[boardId] = {
        ...location.boards[boardId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  // Slide methods
  addSlide(locationId, boardId, name = 'New Slide') {
    const location = this.state.locations[locationId];
    if (!location || !location.boards[boardId]) return null;

    const slideId = `sld_${uuidv4()}`;
    const newSlide = {
      id: slideId,
      name,
      tiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    location.boards[boardId].slides.push(newSlide);
    location.updatedAt = new Date().toISOString();
    
    // If this is the first slide, set it as current
    if (location.boards[boardId].slides.length === 1) {
      this.state.currentSlideIndex = 0;
    }
    
    return slideId;
  }

  updateSlide(locationId, boardId, slideIndex, updates) {
    const location = this.state.locations[locationId];
    if (!location || !location.boards[boardId] || !location.boards[boardId].slides[slideIndex]) {
      return false;
    }

    location.boards[boardId].slides[slideIndex] = {
      ...location.boards[boardId].slides[slideIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    location.updatedAt = new Date().toISOString();
    return true;
  }

  // Tile methods
  addTile(locationId, boardId, slideIndex, tileData) {
    const location = this.state.locations[locationId];
    if (!location || !location.boards[boardId] || !location.boards[boardId].slides[slideIndex]) {
      return null;
    }

    const tileId = `tile_${uuidv4()}`;
    const newTile = {
      id: tileId,
      zIndex: 1, // Default z-index
      ...tileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    location.boards[boardId].slides[slideIndex].tiles.push(newTile);
    location.updatedAt = new Date().toISOString();
    
    return tileId;
  }

  updateTile(locationId, boardId, slideIndex, tileId, updates) {
    const location = this.state.locations[locationId];
    if (!location || !location.boards[boardId] || !location.boards[boardId].slides[slideIndex]) {
      return false;
    }

    const slide = location.boards[boardId].slides[slideIndex];
    const tileIndex = slide.tiles.findIndex(tile => tile.id === tileId);
    
    if (tileIndex === -1) return false;

    slide.tiles[tileIndex] = {
      ...slide.tiles[tileIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    location.updatedAt = new Date().toISOString();
    return true;
  }

  // Getters
  getCurrentState() {
    return {
      ...this.state,
      currentLocation: this.state.currentLocationId ? this.state.locations[this.state.currentLocationId] : null,
      currentBoard: this.state.currentLocationId && this.state.currentBoardId 
        ? this.state.locations[this.state.currentLocationId]?.boards[this.state.currentBoardId] 
        : null,
      currentSlide: this.getCurrentSlide()
    };
  }

  getCurrentSlide() {
    if (!this.state.currentLocationId || !this.state.currentBoardId) return null;
    
    const location = this.state.locations[this.state.currentLocationId];
    if (!location) return null;
    
    const board = location.boards[this.state.currentBoardId];
    if (!board || !board.slides[this.state.currentSlideIndex]) return null;
    
    return board.slides[this.state.currentSlideIndex];
  }

  // Navigation methods
  setCurrentLocation(locationId) {
    if (this.state.locations[locationId]) {
      this.state.currentLocationId = locationId;
      
      // Reset board and slide selection
      const location = this.state.locations[locationId];
      const boardIds = Object.keys(location.boards);
      if (boardIds.length > 0) {
        this.state.currentBoardId = boardIds[0];
        this.state.currentSlideIndex = 0;
      } else {
        this.state.currentBoardId = null;
        this.state.currentSlideIndex = 0;
      }
      
      return true;
    }
    return false;
  }

  setCurrentBoard(boardId) {
    if (!this.state.currentLocationId) return false;
    
    const location = this.state.locations[this.state.currentLocationId];
    if (location && location.boards[boardId]) {
      this.state.currentBoardId = boardId;
      this.state.currentSlideIndex = 0; // Reset to first slide
      return true;
    }
    return false;
  }

  setCurrentSlide(slideIndex) {
    if (!this.state.currentLocationId || !this.state.currentBoardId) return false;
    
    const location = this.state.locations[this.state.currentLocationId];
    if (!location) return false;
    
    const board = location.boards[this.state.currentBoardId];
    if (!board || slideIndex < 0 || slideIndex >= board.slides.length) return false;
    
    this.state.currentSlideIndex = slideIndex;
    return true;
  }
}

export const appState = new AppState();
