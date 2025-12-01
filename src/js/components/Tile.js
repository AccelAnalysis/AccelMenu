import { TILE_TYPES } from '../utils/constants.js';
import { generateId, snapToGrid, clamp, deepClone } from '../utils/helpers.js';

export class Tile {
  /**
   * Create a new Tile instance
   * @param {Object} config - Configuration object for the tile
   * @param {string} [config.type=TILE_TYPES.TEXT] - Type of the tile (text, image, video, lottie)
   * @param {Object} config.position - Position and dimensions of the tile
   * @param {number} config.position.x - X coordinate
   * @param {number} config.position.y - Y coordinate
   * @param {number} config.position.width - Width of the tile
   * @param {number} config.position.height - Height of the tile
   * @param {string|Object} [config.content=''] - Content of the tile (text, image URL, etc.)
   * @param {string} [config.id] - Unique identifier for the tile
   * @param {Object} [config.styles={}] - Additional CSS styles for the tile
   */
  constructor({
    type = TILE_TYPES.TEXT,
    position,
    content = '',
    id = generateId(),
    styles = {},
    onSelect = null
  }) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.content = content;
    this.styles = { ...styles };
    this.onSelect = onSelect;
    this.element = null;
    this.isSelected = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    this.initialize();
  }

  /**
   * Initialize the tile element and event listeners
   */
  initialize() {
    this.createElement();
    this.setupEventListeners();
    this.updatePosition();
    this.updateContent();
  }

  /**
   * Create the tile DOM element
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = `tile ${this.type}-tile`;
    this.element.dataset.tileId = this.id;
    
    // Apply base styles
    Object.assign(this.element.style, {
      position: 'absolute',
      border: '1px solid #ccc',
      boxSizing: 'border-box',
      userSelect: 'none',
      overflow: 'hidden',
      cursor: 'move',
      ...this.styles
    });

    // Add content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'tile-content';
    this.element.appendChild(this.contentElement);
    
    // Add resize handles
    this.addResizeHandles();
  }

  /**
   * Update the tile's position and dimensions based on its position property
   */
  updatePosition() {
    if (!this.element) return;
    
    Object.assign(this.element.style, {
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
      width: `${this.position.width}px`,
      height: `${this.position.height}px`
    });
  }

  /**
   * Update the tile's content based on its type and content property
   */
  updateContent() {
    if (!this.contentElement) return;

    switch (this.type) {
      case TILE_TYPES.TEXT:
        this.contentElement.textContent = this.content;
        break;
      case TILE_TYPES.IMAGE:
        this.contentElement.innerHTML = `<img src="${this.content}" alt="Tile image" style="width: 100%; height: 100%; object-fit: cover;">`;
        break;
      case TILE_TYPES.VIDEO:
        this.contentElement.innerHTML = `
          <video width="100%" height="100%" controls>
            <source src="${this.content}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        `;
        break;
      case TILE_TYPES.LOTTIE:
        this.contentElement.innerHTML = `
          <lottie-player
            src="${this.content}"
            background="transparent"
            speed="1"
            style="width: 100%; height: 100%"
            loop
            autoplay>
          </lottie-player>
        `;
        break;
      default:
        this.contentElement.textContent = 'Unsupported tile type';
    }
  }

  /**
   * Set up event listeners for the tile
   */
  setupEventListeners() {
    if (!this.element) return;

    // Mouse down for dragging
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    
    // Double click to edit
    this.element.addEventListener('dblclick', () => {
      this.toggleEditMode(true);
    });
  }

  /**
   * Handle mouse down event for dragging
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown(e) {
    // Only start drag on left mouse button
    if (e.button !== 0) return;

    e.stopPropagation();
    this.isDragging = true;
    this.dragOffset = {
      x: e.clientX - this.position.x,
      y: e.clientY - this.position.y
    };

    // Select this tile
    this.select();

    // Add global event listeners for drag
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * Handle mouse move event for dragging
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove = (e) => {
    if (!this.isDragging) return;

    // Update position with grid snapping
    this.position.x = snapToGrid(e.clientX - this.dragOffset.x);
    this.position.y = snapToGrid(e.clientY - this.dragOffset.y);
    
    this.updatePosition();
  }

  /**
   * Handle mouse up event to end dragging
   */
  handleMouseUp = () => {
    this.isDragging = false;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * Select this tile
   * @returns {Tile} Returns the tile instance for chaining
   */
  select() {
    // Prevent re-selecting an already selected tile to avoid loops
    if (this.isSelected) return this;
    
    // Update the selected state
    this.isSelected = true;
    this.element.classList.add('selected');
    
    // Notify parent component about the selection
    if (typeof this.onSelect === 'function') {
      this.onSelect(this);
    }
    
    return this;
  }

  /**
   * Deselect this tile
   */
  deselect() {
    this.isSelected = false;
    this.element.classList.remove('selected');
  }

  /**
   * Toggle edit mode for the tile
   * @param {boolean} isEditing - Whether to enable or disable edit mode
   */
  toggleEditMode(isEditing) {
    this.isEditing = isEditing;
    this.element.style.pointerEvents = isEditing ? 'auto' : 'none';
    this.element.style.userSelect = isEditing ? 'auto' : 'none';
    
    // Show/hide resize handles
    const handles = this.element.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      handle.style.display = isEditing ? 'block' : 'none';
    });
    
    // Handle content editing for text tiles
    if (this.type === TILE_TYPES.TEXT) {
      if (isEditing) {
        this.element.setAttribute('contenteditable', 'true');
        this.element.focus();
      } else {
        this.element.removeAttribute('contenteditable');
        this.content = this.element.textContent;
      }
    }
  }
  
  /**
   * Add resize handles to the tile
   */
  addResizeHandles() {
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${pos}`;
      handle.dataset.position = pos;
      handle.addEventListener('mousedown', this.handleResizeStart.bind(this));
      this.element.appendChild(handle);
    });
  }
  
  /**
   * Handle the start of a resize operation
   * @param {MouseEvent} e - The mousedown event
   */
  handleResizeStart(e) {
    e.stopPropagation();
    const position = e.target.dataset.position;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = this.position.width;
    const startHeight = this.position.height;
    const startLeft = this.position.x;
    const startTop = this.position.y;

    const doResize = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (position.includes('e')) {
        this.position.width = Math.max(50, startWidth + dx);
      }
      if (position.includes('s')) {
        this.position.height = Math.max(50, startHeight + dy);
      }
      if (position.includes('w')) {
        const newWidth = Math.max(50, startWidth - dx);
        this.position.width = newWidth;
        this.position.x = startLeft + (startWidth - newWidth);
      }
      if (position.includes('n')) {
        const newHeight = Math.max(50, startHeight - dy);
        this.position.height = newHeight;
        this.position.y = startTop + (startHeight - newHeight);
      }

      this.updatePosition();
    };

    const stopResize = () => {
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
      if (this.onUpdate) {
        this.onUpdate({
          position: { ...this.position }
        });
      }
    };

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
  }

  /**
   * Update the tile's properties
   * @param {Object} updates - Object with updated properties
   */
  update(updates) {
    let needsUpdate = false;

    // Update type if changed
    if (updates.type && updates.type !== this.type) {
      this.type = updates.type;
      this.element.className = `tile ${this.type}-tile`;
      needsUpdate = true;
    }

    // Update position if changed
    if (updates.position) {
      const { x, y, width, height } = updates.position;
      if (x !== undefined) this.position.x = x;
      if (y !== undefined) this.position.y = y;
      if (width !== undefined) this.position.width = width;
      if (height !== undefined) this.position.height = height;
      this.updatePosition();
      needsUpdate = true;
    }
    
    // Update content if changed
    if (updates.content !== undefined && updates.content !== this.content) {
      this.content = updates.content;
      this.updateContent();
      needsUpdate = true;
    }
    
    // Update styles if changed
    if (updates.styles) {
      const styleKeys = Object.keys(updates.styles);
      if (styleKeys.length > 0) {
        styleKeys.forEach(key => {
          if (updates.styles[key] !== this.styles[key]) {
            this.styles[key] = updates.styles[key];
            this.element.style[key] = updates.styles[key];
          }
        });
        needsUpdate = true;
      }
    }

    return needsUpdate;
  }

  /**
   * Check if a point is inside the tile's boundaries
   * @param {number} x - X coordinate of the point
   * @param {number} y - Y coordinate of the point
   * @returns {boolean} True if the point is inside the tile, false otherwise
   */
  isPointInTile(x, y) {
    return (
      x >= this.position.x &&
      x <= this.position.x + this.position.width &&
      y >= this.position.y &&
      y <= this.position.y + this.position.height
    );
  }

  /**
   * Remove the tile from the DOM and clean up event listeners
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.removeEventListener('mousedown', this.handleMouseDown);
      this.element.removeEventListener('dblclick', this.toggleEditMode);
      this.element.remove();
    }
  }
}
