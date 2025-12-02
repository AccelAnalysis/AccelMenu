import { appState } from './services/state.js';
import { Tile } from './components/Tile.js';
import { TileEditor } from './components/TileEditor.js';
import { AdminPanel } from './components/AdminPanel.js';
import { TILE_TYPES } from './utils/constants.js';
import { deepClone, generateId } from './utils/helpers.js';
import { initializeMonitoring, captureFeedback } from '../utils/monitoring.ts';
import { isNewEditorEnabled } from '../utils/featureFlags.ts';

class App {
  constructor() {
    this.tiles = [];
    this.selectedTile = null;
    this.editor = null;
    this.adminPanel = null;
    this.isEditMode = false;
    this.monitoringReady = initializeMonitoring({ tracesSampleRate: 0.05 });
    this.locationSelect = null;
    this.boardSelect = null;
    this.slideSelect = null;

    // Bind methods
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleTileSelect = this.handleTileSelect.bind(this);
    this.handleTileUpdate = this.handleTileUpdate.bind(this);
    this.deleteSelectedTile = this.deleteSelectedTile.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleAddTile = this.handleAddTile.bind(this);
    this.handleUpdateTile = this.handleUpdateTile.bind(this);
    this.handleRemoveTile = this.handleRemoveTile.bind(this);
    this.addNewTile = this.addNewTile.bind(this);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.selectTile = this.selectTile.bind(this);
    this.deselectTile = this.deselectTile.bind(this);
    this.handleSlideSelect = this.handleSlideSelect.bind(this);
    this.handleLocationChange = this.handleLocationChange.bind(this);
    this.handleBoardChange = this.handleBoardChange.bind(this);
    this.handleSlideChange = this.handleSlideChange.bind(this);
    this.addLocation = this.addLocation.bind(this);
    this.addBoard = this.addBoard.bind(this);
    this.addSlide = this.addSlide.bind(this);
    this.togglePanelVisibility = this.togglePanelVisibility.bind(this);
    this.loadCurrentSlideTiles = this.loadCurrentSlideTiles.bind(this);
    this.refreshNavigationUI = this.refreshNavigationUI.bind(this);
    
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupUI();
    this.setupFeedbackWidget();
    this.setupEventListeners();
    
    // Initialize editor
    this.editor = new TileEditor(document.getElementById('tile-editor'), {
      onUpdate: this.handleTileUpdate,
      onDelete: () => this.deleteSelectedTile()
    });
    
    // Initialize admin panel
    this.adminPanel = new AdminPanel(
      document.getElementById('admin-panel'),
      this.handleAddTile,
      this.handleUpdateTile,
      this.handleRemoveTile
    );

    this.adminPanel.setSlideHandlers({
      onAddSlide: this.addSlide,
      onSelectSlide: this.handleSlideSelect
    });

    // Load demo tiles after UI is set up
    this.refreshNavigationUI();
    this.loadCurrentSlideTiles();
    this.loadDemoTiles();
  }

  /**
   * Set up DOM elements
   */
  setupUI() {
    // Get the app container from the DOM or create it
    this.container = document.getElementById('app');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'app';
      document.body.appendChild(this.container);
    }
    this.container.className = 'app-container';

    const header = document.createElement('div');
    header.className = 'app-header';

    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.textContent = 'AccelMenu Admin';

    const navControls = document.createElement('div');
    navControls.className = 'nav-controls';

    // Location selector
    this.locationSelect = document.createElement('select');
    this.locationSelect.id = 'location-select';
    this.locationSelect.addEventListener('change', this.handleLocationChange);
    const addLocationBtn = document.createElement('button');
    addLocationBtn.className = 'btn btn-secondary';
    addLocationBtn.textContent = '+ Location';
    addLocationBtn.addEventListener('click', this.addLocation);

    // Board selector
    this.boardSelect = document.createElement('select');
    this.boardSelect.id = 'board-select';
    this.boardSelect.addEventListener('change', this.handleBoardChange);
    const addBoardBtn = document.createElement('button');
    addBoardBtn.className = 'btn btn-secondary';
    addBoardBtn.textContent = '+ Board';
    addBoardBtn.addEventListener('click', this.addBoard);

    // Slide selector
    this.slideSelect = document.createElement('select');
    this.slideSelect.id = 'slide-select';
    this.slideSelect.addEventListener('change', this.handleSlideChange);
    const addSlideBtn = document.createElement('button');
    addSlideBtn.className = 'btn btn-secondary';
    addSlideBtn.textContent = '+ Slide';
    addSlideBtn.addEventListener('click', this.addSlide);

    const panelToggles = document.createElement('div');
    panelToggles.className = 'panel-toggles';
    const toggleAdminBtn = document.createElement('button');
    toggleAdminBtn.className = 'btn btn-secondary';
    toggleAdminBtn.id = 'toggle-admin-panel';
    toggleAdminBtn.textContent = 'Toggle Left Panel';
    toggleAdminBtn.addEventListener('click', () => this.togglePanelVisibility('admin'));

    const toggleEditorBtn = document.createElement('button');
    toggleEditorBtn.className = 'btn btn-secondary';
    toggleEditorBtn.id = 'toggle-editor-panel';
    toggleEditorBtn.textContent = 'Toggle Right Panel';
    toggleEditorBtn.addEventListener('click', () => this.togglePanelVisibility('editor'));

    panelToggles.appendChild(toggleAdminBtn);
    panelToggles.appendChild(toggleEditorBtn);

    [
      ['Location', this.locationSelect, addLocationBtn],
      ['Board', this.boardSelect, addBoardBtn],
      ['Slide', this.slideSelect, addSlideBtn]
    ].forEach(([label, select, button]) => {
      const group = document.createElement('div');
      group.className = 'nav-group';
      const groupLabel = document.createElement('span');
      groupLabel.textContent = label;
      group.appendChild(groupLabel);
      group.appendChild(select);
      group.appendChild(button);
      navControls.appendChild(group);
    });

    header.appendChild(brand);
    header.appendChild(navControls);
    header.appendChild(panelToggles);

    // Create main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    
    // Create admin panel container
    const adminPanelContainer = document.createElement('div');
    adminPanelContainer.className = 'admin-panel-container';
    adminPanelContainer.id = 'admin-panel';
    
    // Create canvas for tiles
    this.canvas = document.createElement('div');
    this.canvas.className = 'tile-canvas';
    this.canvas.id = 'tile-canvas';
    
    // Create editor panel container
    const editorPanel = document.createElement('div');
    editorPanel.className = 'editor-panel';
    editorPanel.id = 'tile-editor';
    
    // Add elements to main content
    mainContent.appendChild(adminPanelContainer);
    mainContent.appendChild(this.canvas);
    mainContent.appendChild(editorPanel);

    this.container.appendChild(header);
    this.container.appendChild(mainContent);
    
    // Add to body
    document.body.appendChild(this.container);
    
    // Add some basic styles
    this.addStyles();
  }

  /**
   * Add basic styles
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body, html {
        margin: 0;
        padding: 0;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .app-container {
        display: flex;
        height: 100vh;
        flex-direction: column;
      }

      .tile-canvas {
        flex: 1;
        position: relative;
        background-color: #f5f5f5;
        overflow: hidden;
      }
      
      .admin-panel-container {
        width: 250px;
        background-color: #f8f9fa;
        border-right: 1px solid #e0e0e0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        transition: width 0.2s ease, opacity 0.2s ease;
        min-width: 200px;
      }

      .editor-panel {
        width: 300px;
        background-color: #fff;
        border-left: 1px solid #e0e0e0;
        overflow-y: auto;
        display: none; /* Hidden by default */
        transition: width 0.2s ease, opacity 0.2s ease;
      }

      .admin-panel-container.collapsed,
      .editor-panel.collapsed {
        width: 0;
        min-width: 0;
        opacity: 0;
        pointer-events: none;
        overflow: hidden;
        border: none;
      }
      
      .tile {
        position: absolute;
        border: 2px solid transparent;
        transition: border-color 0.2s;
      }
      
      .tile.selected {
        border-color: #2196f3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
      }
      
      .tile-content {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        box-sizing: border-box;
        word-break: break-word;
        overflow: hidden;
      }
      
      .app-header {
        background-color: #0f172a;
        color: white;
        padding: 10px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        gap: 12px;
      }

      .toolbar {
        display: flex;
        gap: 10px;
      }

      .brand {
        font-weight: 700;
      }

      .nav-controls {
        display: flex;
        gap: 12px;
        align-items: center;
        flex: 1;
        flex-wrap: wrap;
      }

      .nav-group {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,0.05);
        padding: 6px 8px;
        border-radius: 8px;
      }

      .nav-group span {
        font-size: 12px;
        color: #cbd5e1;
      }

      .nav-group select {
        padding: 6px;
        border-radius: 6px;
        border: 1px solid #334155;
        background: #0b1224;
        color: #e2e8f0;
      }

      .panel-toggles {
        display: flex;
        gap: 8px;
      }
      
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 14px;
      }
      
      .btn-primary {
        background-color: #1976d2;
        color: white;
      }
      
      .btn-secondary {
        background-color: #f5f5f5;
        color: #333;
      }
      
      .main-content {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .slide-stack {
        border-bottom: 1px solid #e2e8f0;
        padding: 12px;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .slide-stack-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .slide-stack-item {
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .slide-stack-item.active {
        border-color: #2196f3;
        box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
      }

      .slide-stack-label {
        font-weight: 600;
      }

      .slide-stack-meta {
        font-size: 12px;
        color: #6b7280;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add a lightweight feedback widget for early adopters.
   */
  setupFeedbackWidget() {
    if (!isNewEditorEnabled() || typeof document === 'undefined') return;

    const target = document.body || this.container;
    if (!target) return;

    const feedbackContainer = document.createElement('div');
    Object.assign(feedbackContainer.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      maxWidth: '320px',
      zIndex: '999998',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    });

    const title = document.createElement('div');
    title.textContent = 'Early adopters: tell us what you think';
    Object.assign(title.style, {
      fontWeight: '700',
      fontSize: '14px',
      marginBottom: '8px',
    });

    const form = document.createElement('form');
    form.style.display = 'none';
    form.style.marginTop = '8px';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'What should we improve in the new editor?';
    Object.assign(textarea.style, {
      width: '100%',
      minHeight: '60px',
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #1e293b',
      resize: 'vertical',
      fontFamily: 'inherit',
    });

    const email = document.createElement('input');
    email.type = 'email';
    email.placeholder = 'Email (optional)';
    Object.assign(email.style, {
      width: '100%',
      marginTop: '6px',
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #1e293b',
      fontFamily: 'inherit',
    });

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Send feedback';
    Object.assign(submit.style, {
      marginTop: '10px',
      width: '100%',
      padding: '10px 12px',
      background: '#22d3ee',
      color: '#0f172a',
      fontWeight: '700',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    });

    const status = document.createElement('div');
    Object.assign(status.style, {
      marginTop: '6px',
      fontSize: '12px',
      color: '#a5f3fc',
    });

    form.appendChild(textarea);
    form.appendChild(email);
    form.appendChild(submit);
    form.appendChild(status);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const message = textarea.value.trim();
      if (!message) {
        status.textContent = 'Please add a quick note before sending.';
        return;
      }

      captureFeedback({
        message,
        email: email.value.trim() || undefined,
        tags: {
          feature: 'new-editor',
          cohort: 'early-adopter',
        },
      });

      status.textContent = 'Thanks! Your feedback helps shape the new editor.';
      textarea.value = '';
    });

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.textContent = 'Share feedback';
    Object.assign(toggleButton.style, {
      background: '#22c55e',
      color: '#0b1224',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 12px',
      fontWeight: '700',
      cursor: 'pointer',
      width: '100%',
    });

    toggleButton.addEventListener('click', () => {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
      status.textContent = '';
    });

    feedbackContainer.appendChild(title);
    feedbackContainer.appendChild(toggleButton);
    feedbackContainer.appendChild(form);

    target.appendChild(feedbackContainer);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Canvas click handler
    this.canvas = this.canvas || document.getElementById('tile-canvas');
    if (this.canvas) {
      this.canvas.addEventListener('click', this.handleCanvasClick);
    }
    
    // Add tile button
    const addTileBtn = document.getElementById('add-tile-btn');
    if (addTileBtn) {
      addTileBtn.addEventListener('click', () => this.addNewTile());
    }
    
    // Create a container for the edit mode toggle
    console.log('Creating edit mode toggle...');
    
    // First, check if body exists
    if (!document.body) {
      console.error('Document body not found!');
      return;
    }
    
    // Create container with inline styles
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'edit-mode-toggle-container';
    Object.assign(toggleContainer.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      backgroundColor: 'transparent',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      cursor: 'pointer',
      border: 'none',
      boxShadow: 'none',
      pointerEvents: 'auto'
    });
    
    // Create the actual toggle button
    const editToggle = document.createElement('button');
    editToggle.textContent = 'EDIT';
    Object.assign(editToggle.style, {
      background: 'transparent',
      border: 'none',
      color: 'rgba(255, 255, 255, 0)',
      fontSize: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      pointerEvents: 'auto',
      padding: '5px',
      textAlign: 'center'
    });
    editToggle.title = 'Click to enter edit mode';
    
    // Add click handler
    const toggleHandler = (e) => {
      console.log('Edit mode toggle clicked');
      e.preventDefault();
      e.stopPropagation();
      this.toggleEditMode();
      return false;
    };
    
    // Add event listeners
    toggleContainer.addEventListener('click', toggleHandler);
    
    try {
      // Add to body
      toggleContainer.appendChild(editToggle);
      document.body.appendChild(toggleContainer);
      console.log('Edit mode toggle should be visible in bottom-right corner');
      
      // Log the computed styles to debug visibility
      setTimeout(() => {
        const el = document.getElementById('edit-mode-toggle-container');
        if (el) {
          console.log('Toggle container found in DOM');
          const styles = window.getComputedStyle(el);
          console.log('Toggle container styles:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            position: styles.position,
            zIndex: styles.zIndex,
            width: styles.width,
            height: styles.height
          });
        } else {
          console.error('Toggle container not found in DOM after insertion');
        }
      }, 100);
    } catch (error) {
      console.error('Error adding toggle to DOM:', error);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  handleLocationChange(event) {
    const nextLocationId = event.target.value;
    const changed = appState.setCurrentLocation(nextLocationId);
    if (changed) {
      this.refreshNavigationUI();
      this.loadCurrentSlideTiles();
    }
  }

  handleBoardChange(event) {
    const nextBoardId = event.target.value;
    const changed = appState.setCurrentBoard(nextBoardId);
    if (changed) {
      this.refreshNavigationUI();
      this.loadCurrentSlideTiles();
    }
  }

  handleSlideChange(event) {
    const index = parseInt(event.target.value, 10);
    this.handleSlideSelect(index);
  }

  handleSlideSelect(index) {
    const changed = appState.setCurrentSlide(index);
    if (changed) {
      this.refreshNavigationUI();
      this.loadCurrentSlideTiles();
    }
  }

  addLocation() {
    const name = prompt('Location name');
    const newName = name?.trim() || 'New Location';
    const locationId = appState.addLocation(newName);
    const boardId = appState.addBoard(locationId, 'Main Board');
    appState.addSlide(locationId, boardId, 'New Slide');
    appState.setCurrentLocation(locationId);
    appState.setCurrentBoard(boardId);
    appState.setCurrentSlide(0);
    this.refreshNavigationUI();
    this.loadCurrentSlideTiles();
  }

  addBoard() {
    const { currentLocationId } = appState.state;
    if (!currentLocationId) return;

    const name = prompt('Board name');
    const boardId = appState.addBoard(currentLocationId, name?.trim() || 'New Board');
    if (boardId) {
      const slides = appState.state.locations[currentLocationId]?.boards[boardId]?.slides || [];
      if (!slides.length) {
        appState.addSlide(currentLocationId, boardId, 'New Slide');
      }
    }
    appState.setCurrentBoard(boardId);
    appState.setCurrentSlide(0);
    this.refreshNavigationUI();
    this.loadCurrentSlideTiles();
  }

  addSlide() {
    const { currentLocationId, currentBoardId } = appState.state;
    if (!currentLocationId || !currentBoardId) return;

    const name = prompt('Slide name');
    const slideId = appState.addSlide(currentLocationId, currentBoardId, name?.trim() || 'New Slide');
    const board = appState.state.locations[currentLocationId]?.boards[currentBoardId];
    const slideIndex = board?.slides.findIndex(slide => slide.id === slideId) ?? 0;
    appState.setCurrentSlide(slideIndex);
    this.refreshNavigationUI();
    this.loadCurrentSlideTiles();
  }

  /**
   * Handle canvas click events
   * @param {MouseEvent} event - The click event
   */
  handleCanvasClick(event) {
    if (!this.isEditMode) return;
    
    // Get the click position relative to the canvas
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if a tile was clicked
    const clickedTile = this.tiles.find(tile => tile.isPointInTile && tile.isPointInTile(x, y));
    
    if (clickedTile) {
      this.selectTile(clickedTile);
    } else if (this.selectedTile) {
      // Deselect the current tile if clicking on empty space
      this.deselectTile();
    }
  }
  
  /**
   * Handle tile selection
   * @param {Tile} tile - The tile that was selected
   */
  handleTileSelect(tile) {
    this.selectTile(tile);
  }
  
  /**
   * Handle tile updates from the editor
   * @param {Object} updatedProps - The updated tile properties
   */
  handleTileUpdate(updatedProps) {
    if (!this.selectedTile) return;
    
    // Update the tile with new properties
    this.selectedTile.update(updatedProps);
    
    // Update app state
    this.updateAppState();
    
    // Update admin panel
    if (this.adminPanel) {
      this.adminPanel.updateTileList(this.tiles);
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown(event) {
    // Handle delete/backspace key to remove selected tile
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedTile) {
      this.deleteSelectedTile();
    }
    // Handle escape key to deselect tile
    else if (event.key === 'Escape' && this.selectedTile) {
      this.deselectTile();
    }
  }

  /**
   * Load tiles from state or create demo tiles
   */
  loadDemoTiles() {
    const slide = appState.getCurrentSlide();
    if (slide?.tiles?.length) {
      return;
    }

    // Clear existing tiles
    this.tiles.forEach(tile => tile.destroy());
    this.tiles = [];
    
    // Add some demo tiles
    const demoTextTile = this.createTile({
      id: generateId(),
      type: TILE_TYPES.TEXT,
      name: 'Welcome Tile',
      content: 'Double click to edit this text',
      position: { x: 50, y: 50, width: 200, height: 100 },
      styles: {
        backgroundColor: '#f0f8ff',
        color: '#333',
        fontSize: '16px',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }
    });
    
    const demoImageTile = this.createTile({
      id: generateId(),
      type: TILE_TYPES.IMAGE,
      name: 'Sample Image',
      content: 'https://picsum.photos/seed/picsum/300/200',
      position: { x: 300, y: 50, width: 300, height: 200 },
      styles: {
        border: '2px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        objectFit: 'cover'
      }
    });
    
    // Update app state
    this.updateAppState();
    
    // Update admin panel
    this.adminPanel.updateTileList(this.tiles);
  }

  /**
   * Create a new tile
   * @param {Object} config - Tile configuration
   */
  createTile(config) {
    const tile = new Tile({
      ...config,
      onSelect: (selectedTile) => this.selectTile(selectedTile)
    });
    
    this.tiles.push(tile);
    this.canvas.appendChild(tile.element);
    
    // Update app state
    this.updateAppState();
    
    // Update admin panel
    if (this.adminPanel) {
      this.adminPanel.updateTileList(this.tiles);
    }
    
    return tile;
  }
  
  /**
   * Update the application state
   */
  updateAppState() {
    const { currentLocationId, currentBoardId, currentSlideIndex } = appState.state;
    if (!currentLocationId || !currentBoardId) return;

    appState.setSlideTiles(
      currentLocationId,
      currentBoardId,
      currentSlideIndex,
      this.tiles.map(tile => ({
        id: tile.id,
        type: tile.type,
        content: tile.content,
        name: tile.name || `Tile ${tile.id.substring(0, 4)}`,
        position: { ...tile.position },
        styles: { ...tile.styles }
      }))
    );
  }

  loadCurrentSlideTiles() {
    // Remove any existing tiles from canvas
    this.tiles.forEach(tile => tile.destroy());
    this.tiles = [];

    if (this.selectedTile) {
      this.selectedTile.deselect();
      this.selectedTile = null;
    }

    if (this.editor) {
      this.editor.hide();
    }

    const state = appState.getCurrentState();
    const slide = state.currentSlide;

    if (slide?.tiles?.length) {
      slide.tiles.forEach(tileData => {
        this.createTile(deepClone(tileData));
      });
    }

    if (this.adminPanel) {
      this.adminPanel.updateTileList(this.tiles);
      this.adminPanel.renderSlideStack(state.currentBoard?.slides || [], state.currentSlideIndex || 0);
    }
  }

  refreshNavigationUI() {
    const state = appState.getCurrentState();

    if (this.locationSelect) {
      this.locationSelect.innerHTML = '';
      Object.values(state.locations).forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        option.selected = location.id === state.currentLocationId;
        this.locationSelect.appendChild(option);
      });
    }

    if (this.boardSelect) {
      this.boardSelect.innerHTML = '';
      const boards = state.currentLocation?.boards || {};
      Object.values(boards).forEach(board => {
        const option = document.createElement('option');
        option.value = board.id;
        option.textContent = board.name;
        option.selected = board.id === state.currentBoardId;
        this.boardSelect.appendChild(option);
      });
    }

    if (this.slideSelect) {
      this.slideSelect.innerHTML = '';
      const slides = state.currentBoard?.slides || [];
      slides.forEach((slide, index) => {
        const option = document.createElement('option');
        option.value = `${index}`;
        option.textContent = slide.name || `Slide ${index + 1}`;
        option.selected = index === state.currentSlideIndex;
        this.slideSelect.appendChild(option);
      });
    }

    if (this.adminPanel) {
      this.adminPanel.renderSlideStack(state.currentBoard?.slides || [], state.currentSlideIndex || 0);
    }
  }

  togglePanelVisibility(panel) {
    const adminPanel = document.querySelector('.admin-panel-container');
    const editorPanel = document.querySelector('.editor-panel');

    if (panel === 'admin' && adminPanel) {
      adminPanel.classList.toggle('collapsed');
    }

    if (panel === 'editor' && editorPanel) {
      editorPanel.classList.toggle('collapsed');
    }
  }

  /**
   * Add a new tile with default properties
   */
  addNewTile() {
    const newTile = this.createTile({
      id: generateId(),
      type: TILE_TYPES.TEXT,
      name: `Tile ${this.tiles.length + 1}`,
      content: 'New Tile',
      position: { x: 50, y: 50, width: 200, height: 100 },
      styles: {
        backgroundColor: '#ffffff',
        color: '#333333',
        fontSize: '16px',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }
    });
    
    // Select the new tile
    this.selectTile(newTile);
    
    return newTile;
  }
  
  /**
   * Toggle edit mode for the application
   */
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    document.body.classList.toggle('edit-mode', this.isEditMode);
    
    // Toggle edit mode for all tiles
    this.tiles.forEach(tile => {
      if (tile.toggleEditMode) {
        tile.toggleEditMode(this.isEditMode);
      }
    });
    
    // Show/hide admin panel and editor based on edit mode
    const adminPanel = document.querySelector('.admin-panel-container');
    const editorPanel = document.querySelector('.editor-panel');
    
    if (this.isEditMode) {
      if (adminPanel) adminPanel.style.display = 'block';
      if (editorPanel) editorPanel.style.display = 'block';
    } else {
      if (adminPanel) adminPanel.style.display = 'none';
      if (editorPanel) editorPanel.style.display = 'none';
      this.deselectTile(); // Deselect any selected tile when exiting edit mode
    }
    
    // Update the toggle button text
    const toggleEditBtn = document.getElementById('toggle-edit-btn');
    if (toggleEditBtn) {
      toggleEditBtn.textContent = this.isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
    }
    
    // Update the app state
    this.updateAppState();
  }
  
  /**
   * Handle adding a new tile from the admin panel
   * @param {Object} tileData - New tile data
   */
  handleAddTile(tileData) {
    const newTile = this.createTile({
      id: tileData.id,
      type: tileData.type,
      position: tileData.position,
      content: tileData.content || '',
      styles: tileData.styles || {},
      name: tileData.name || `Tile ${tileData.id.substring(0, 4)}`
    });
    
    // Select the new tile
    this.selectTile(newTile);
    
    return newTile;
  }
  
  /**
   * Handle updating a tile from the admin panel
   * @param {string} tileId - ID of the tile to update
   * @param {Object} updates - Updated properties
   */
  handleUpdateTile(tileId, updates) {
    const tile = this.tiles.find(t => t.id === tileId);
    if (tile) {
      tile.update(updates);
      this.updateAppState();
      
      // If this is the selected tile, update the editor
      if (this.selectedTile && this.selectedTile.id === tileId) {
        this.editor.setTile({
          ...tile,
          position: { ...tile.position },
          styles: { ...tile.styles }
        });
      }
    }
  }
  
  /**
   * Handle removing a tile from the admin panel
   * @param {string} tileId - ID of the tile to remove
   */
  handleRemoveTile(tileId) {
    const index = this.tiles.findIndex(t => t.id === tileId);
    if (index !== -1) {
      const [removedTile] = this.tiles.splice(index, 1);
      removedTile.destroy();
      const { currentLocationId, currentBoardId, currentSlideIndex } = appState.state;
      if (currentLocationId && currentBoardId) {
        appState.removeTile(currentLocationId, currentBoardId, currentSlideIndex, tileId);
      }
      this.updateAppState();

      // If the removed tile was selected, deselect it
      if (this.selectedTile && this.selectedTile.id === tileId) {
        this.deselectTile();
      }
    }
  }

  /**
   * Select a tile
   * @param {Tile} tile - The tile to select
   */
  selectTile(tile) {
    // Prevent re-selecting the same tile
    if (this.selectedTile === tile) return;
    
    // Deselect current tile
    if (this.selectedTile) {
      this.selectedTile.deselect();
    }
    
    // Select new tile
    this.selectedTile = tile;
    if (this.selectedTile) {
      this.selectedTile.select();
      
      // Show editor with tile data
      if (this.editor) {
        this.editor.show({
          ...this.selectedTile,
          position: { ...this.selectedTile.position },
          styles: { ...this.selectedTile.styles }
        });
        
        // Show editor container
        const editorContainer = document.querySelector('.editor-panel');
        if (editorContainer) {
          editorContainer.style.display = 'block';
        }
      }
    }
    
    // Update admin panel selection
    if (this.adminPanel) {
      this.adminPanel.selectedTileId = tile ? tile.id : null;
      this.adminPanel.updateTileList(this.tiles);
    }
  }

  /**
   * Deselect the currently selected tile
   */
  deselectTile() {
    if (this.selectedTile) {
      this.selectedTile.deselect();
      this.selectedTile = null;
    }
    
    // Hide editor
    if (this.editor) {
      this.editor.hide();
      
      const editorContainer = document.querySelector('.editor-panel');
      if (editorContainer) {
        editorContainer.style.display = 'none';
      }
    }
    
    // Update admin panel selection
    if (this.adminPanel) {
      this.adminPanel.selectedTileId = null;
      this.adminPanel.updateTileList(this.tiles);
    }
  }

  /**
   * Update the selected tile with new properties
   * @param {Object} updates - Updated tile properties
   */
  updateSelectedTile(updates) {
    if (!this.selectedTile) return;
    
    // Update tile
    this.selectedTile.update(updates);
    
    // Update state
    this.updateAppState();
    
    // Update admin panel
    if (this.adminPanel) {
      this.adminPanel.updateTileList(this.tiles);
    }
  }

  /**
   * Delete the currently selected tile
   */
  deleteSelectedTile() {
    if (!this.selectedTile) return;

    // Remove from DOM
    this.selectedTile.destroy();

    // Remove from tiles array
    const index = this.tiles.findIndex(t => t.id === this.selectedTile.id);
    if (index !== -1) {
      const removed = this.tiles.splice(index, 1);
      const { currentLocationId, currentBoardId, currentSlideIndex } = appState.state;
      if (removed.length && currentLocationId && currentBoardId) {
        appState.removeTile(currentLocationId, currentBoardId, currentSlideIndex, removed[0].id);
      }
      this.updateAppState();
    }
    
    // Reset selection
    this.deselectTile();
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
