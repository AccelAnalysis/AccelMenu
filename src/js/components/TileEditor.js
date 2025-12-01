import { TILE_TYPES, DEFAULT_TILE } from '../utils/constants.js';
import { deepClone, isValidUrl } from '../utils/helpers.js';

// Import editor styles
import '../../css/components/editor.css';

/**
 * TileEditor - A component for editing tile properties
 */
export class TileEditor {
  /**
   * Create a new TileEditor
   * @param {HTMLElement} container - The container element where the editor will be rendered
   * @param {Object} options - Configuration options
   * @param {Function} options.onUpdate - Callback when a tile is updated
   * @param {Function} options.onDelete - Callback when a tile is deleted
   */
  constructor(container, { onUpdate, onDelete }) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;
    this.currentTile = null;
    this.formElements = {};
    
    this.initialize();
  }

  /**
   * Initialize the editor UI
   */
  initialize() {
    this.container.innerHTML = `
      <div class="tile-editor">
        <div class="editor-header">
          <h3>Tile Properties</h3>
          <button class="delete-btn" title="Delete Tile">×</button>
        </div>
        <div class="editor-content">
          <div class="form-section">
            <h4>Basic</h4>
            <div class="form-group">
              <label>Type</label>
              <select name="type" class="form-control">
                ${Object.entries(TILE_TYPES).map(([key, value]) => 
                  `<option value="${value}">${key.charAt(0) + key.slice(1).toLowerCase()}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group content-group">
              <label for="content">Content</label>
              <div class="content-input-container">
                <textarea 
                  id="content" 
                  name="content" 
                  class="form-control" 
                  rows="3"
                  placeholder="Enter content based on tile type"
                ></textarea>
                <div class="content-preview"></div>
              </div>
              <small class="form-text text-muted content-hint">
                ${this.getContentHint(TILE_TYPES.TEXT)}
              </small>
            </div>
            <div class="form-group">
              <label>Name</label>
              <input 
                type="text" 
                name="name" 
                class="form-control" 
                placeholder="Optional tile name"
              >
            </div>
          </div>

          <div class="form-section">
            <h4>Position & Size</h4>
            <div class="form-row">
              <div class="form-group">
                <label>X</label>
                <input type="number" name="x" class="form-control" step="1">
              </div>
              <div class="form-group">
                <label>Y</label>
                <input type="number" name="y" class="form-control" step="1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Width</label>
                <input type="number" name="width" class="form-control" min="50" step="1">
              </div>
              <div class="form-group">
                <label>Height</label>
                <input type="number" name="height" class="form-control" min="50" step="1">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Appearance</h4>
            <div class="form-group">
              <label>Background Color</label>
              <div class="color-picker">
                <input type="color" name="backgroundColor" class="form-control">
                <input type="text" name="backgroundColorText" class="form-control" placeholder="#RRGGBB">
              </div>
            </div>
            <div class="form-group">
              <label>Text Color</label>
              <div class="color-picker">
                <input type="color" name="color" class="form-control">
                <input type="text" name="colorText" class="form-control" placeholder="#RRGGBB">
              </div>
            </div>
            <div class="form-group">
              <label>Border Radius</label>
              <input type="range" name="borderRadius" class="form-control" min="0" max="50" value="0">
              <div class="range-value">0px</div>
            </div>
            <div class="form-group">
              <label>Opacity</label>
              <input type="range" name="opacity" class="form-control" min="0" max="1" step="0.1" value="1">
              <div class="range-value">100%</div>
            </div>
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary save-btn">Save Changes</button>
        </div>
      </div>
    `;

    // Cache form elements
    this.form = this.container.querySelector('.tile-editor');
    this.formElements = {
      type: this.form.querySelector('[name="type"]'),
      content: this.form.querySelector('[name="content"]'),
      name: this.form.querySelector('[name="name"]'),
      x: this.form.querySelector('[name="x"]'),
      y: this.form.querySelector('[name="y"]'),
      width: this.form.querySelector('[name="width"]'),
      height: this.form.querySelector('[name="height"]'),
      backgroundColor: this.form.querySelector('[name="backgroundColor"]'),
      backgroundColorText: this.form.querySelector('[name="backgroundColorText"]'),
      color: this.form.querySelector('[name="color"]'),
      colorText: this.form.querySelector('[name="colorText"]'),
      borderRadius: this.form.querySelector('[name="borderRadius"]'),
      opacity: this.form.querySelector('[name="opacity"]'),
      deleteBtn: this.form.querySelector('.delete-btn'),
      saveBtn: this.form.querySelector('.save-btn')
    };
    
    // Verify all required form elements exist
    for (const [key, element] of Object.entries(this.formElements)) {
      if (!element) {
        console.warn(`Form element not found: ${key}`);
      }
    }

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the editor
   */
  setupEventListeners() {
    // Save button
    this.formElements.saveBtn.addEventListener('click', () => this.handleSave());
    
    // Delete button
    this.formElements.deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this tile?')) {
        this.handleDelete();
      }
    });

    // Tile type change handler
    this.formElements.type.addEventListener('change', (e) => {
      this.updateContentFieldForType(e.target.value);
    });

    // Content validation and preview
    this.formElements.content.addEventListener('input', (e) => {
      this.validateContent(e.target.value, this.formElements.type.value);
    });

    // Color picker synchronization
    this.formElements.backgroundColor.addEventListener('input', (e) => {
      this.formElements.backgroundColorText.value = e.target.value;
      this.updatePreview();
    });
    
    this.formElements.backgroundColorText.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        this.formElements.backgroundColor.value = e.target.value;
        this.updatePreview();
      }
    });

    this.formElements.color.addEventListener('input', (e) => {
      this.formElements.colorText.value = e.target.value;
      this.updatePreview();
    });
    
    this.formElements.colorText.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        this.formElements.color.value = e.target.value;
        this.updatePreview();
      }
    });

    // Range value display and preview update
    this.formElements.borderRadius.addEventListener('input', (e) => {
      const value = e.target.value;
      e.target.nextElementSibling.textContent = `${value}px`;
      this.updatePreview({ borderRadius: `${value}px` });
    });

    this.formElements.opacity.addEventListener('input', (e) => {
      const value = e.target.value;
      e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
      this.updatePreview({ opacity: value });
    });
    
    // Position and size changes
    ['x', 'y', 'width', 'height'].forEach(prop => {
      this.formElements[prop].addEventListener('change', () => {
        this.updatePreview({
          position: {
            [prop]: parseInt(this.formElements[prop].value, 10)
          }
        });
      });
    });
  }

  /**
   * Handle save button click
   */
  handleSave() {
    if (!this.currentTile) return;

    const updates = {
      type: this.formElements.type.value,
      content: this.formElements.content.value,
      position: {
        x: parseInt(this.formElements.x.value, 10),
        y: parseInt(this.formElements.y.value, 10),
        width: parseInt(this.formElements.width.value, 10),
        height: parseInt(this.formElements.height.value, 10)
      },
      styles: {
        backgroundColor: this.formElements.backgroundColor.value || 'transparent',
        color: this.formElements.color.value || '#000000',
        borderRadius: `${this.formElements.borderRadius.value}px`,
        opacity: this.formElements.opacity.value
      }
    };

    if (this.onUpdate) {
      this.onUpdate(updates);
    }
  }

  /**
   * Handle delete button click
   */
  handleDelete() {
    if (this.onDelete) {
      this.onDelete();
    }
    this.hide();
  }

  /**
   * Show the editor with the given tile's data
   * @param {Object} tile - The tile to edit
   */
  show(tile) {
    this.currentTile = tile;
    this.updateForm();
    this.container.style.display = 'block';
  }

  /**
   * Hide the editor
   */
  hide() {
    this.currentTile = null;
    this.container.style.display = 'none';
  }

  /**
   * Update the form with the current tile's data
   */
  /**
   * Get content hint based on tile type
   * @param {string} type - Tile type
   * @returns {string} Help text for the content field
   */
  getContentHint(type) {
    switch (type) {
      case TILE_TYPES.IMAGE:
        return 'Enter image URL (JPEG, PNG, GIF, SVG)';
      case TILE_TYPES.VIDEO:
        return 'Enter video URL (MP4, WebM, OGG)';
      case TILE_TYPES.LOTTIE:
        return 'Enter Lottie JSON URL or paste JSON directly';
      case TILE_TYPES.TEXT:
      default:
        return 'Enter text content';
    }
  }

  /**
   * Update content field based on selected tile type
   * @param {string} type - Tile type
   */
  updateContentFieldForType(type) {
    const contentGroup = this.container.querySelector('.content-group');
    const hint = this.container.querySelector('.content-hint');
    const preview = this.container.querySelector('.content-preview');
    
    // Update hint
    hint.textContent = this.getContentHint(type);
    
    // Update placeholder
    const contentInput = this.formElements.content;
    contentInput.placeholder = this.getContentHint(type);
    
    // Toggle preview visibility
    if (type === TILE_TYPES.IMAGE || type === TILE_TYPES.VIDEO) {
      contentGroup.classList.add('has-preview');
      preview.style.display = 'block';
    } else {
      contentGroup.classList.remove('has-preview');
      preview.style.display = 'none';
    }
    
    // Validate current content against new type
    this.validateContent(contentInput.value, type);
  }

  /**
   * Validate content based on tile type
   * @param {string} content - Content to validate
   * @param {string} type - Tile type
   */
  validateContent(content, type) {
    const contentInput = this.formElements.content;
    const preview = this.container.querySelector('.content-preview');
    let isValid = true;
    
    switch (type) {
      case TILE_TYPES.IMAGE:
        isValid = this.validateImageUrl(content);
        if (isValid) {
          preview.innerHTML = `<img src="${content}" alt="Preview" style="max-width: 100%; max-height: 150px;">`;
        } else if (content) {
          preview.innerHTML = '<div class="preview-error">Invalid image URL</div>';
        }
        break;
        
      case TILE_TYPES.VIDEO:
        isValid = this.validateVideoUrl(content);
        if (isValid) {
          preview.innerHTML = `
            <video controls style="max-width: 100%; max-height: 150px;">
              <source src="${content}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          `;
        } else if (content) {
          preview.innerHTML = '<div class="preview-error">Invalid video URL</div>';
        }
        break;
        
      case TILE_TYPES.LOTTIE:
        isValid = this.validateLottieContent(content);
        if (isValid) {
          preview.innerHTML = '<div class="preview-success">✓ Valid Lottie content</div>';
        } else if (content) {
          preview.innerHTML = '<div class="preview-error">Invalid Lottie JSON</div>';
        }
        break;
        
      default:
        // No validation for text tiles
        break;
    }
    
    // Update UI
    contentInput.setCustomValidity(isValid ? '' : 'Invalid content for selected type');
    contentInput.reportValidity();
    return isValid;
  }

  /**
   * Validate image URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  validateImageUrl(url) {
    if (!url) return true;
    
    // Check for standard image file extensions
    const imagePattern = /\.(jpeg|jpg|gif|png|svg)(\?.*)?$/i;
    // Check for SharePoint URL pattern
    const sharepointPattern = /sharepoint\.com\/:u:/i;
    
    return imagePattern.test(url) || 
           url.startsWith('data:image/') || 
           sharepointPattern.test(url);
  }

  /**
   * Validate video URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  validateVideoUrl(url) {
    if (!url) return true;
    const pattern = /\.(mp4|webm|ogg)(\?.*)?$/i;
    return pattern.test(url);
  }

  /**
   * Validate Lottie content (basic validation)
   * @param {string} content - Content to validate
   * @returns {boolean} True if valid
   */
  validateLottieContent(content) {
    if (!content) return true;
    
    // Check if it's a URL
    if (content.startsWith('http')) {
      return true; // Assume valid URL, actual validation would require a request
    }
    
    // Check if it's valid JSON
    try {
      const json = JSON.parse(content);
      return json.v && json.fr && json.op && json.ip && json.layers;
    } catch (e) {
      return false;
    }
  }

  /**
   * Update the preview with current form values
   * @param {Object} overrides - Optional overrides for preview
   */
  updatePreview(overrides = {}) {
    if (!this.currentTile) return;
    
    // Get current values
    const previewStyles = {
      backgroundColor: this.formElements.backgroundColor.value || 'transparent',
      color: this.formElements.color.value || '#000000',
      borderRadius: `${this.formElements.borderRadius.value}px`,
      opacity: this.formElements.opacity.value
    };
    
    // Apply overrides
    Object.assign(previewStyles, overrides);
    
    // Update preview element if it exists
    const preview = this.container.querySelector('.content-preview');
    if (preview) {
      Object.assign(preview.style, previewStyles);
    }
  }

  /**
   * Safely set a form element's value if it exists
   */
  safeSetValue(element, value, defaultValue = '') {
    if (element && 'value' in element) {
      element.value = value !== undefined ? value : defaultValue;
    }
  }

  /**
   * Update the form with the current tile's data
   */
  updateForm() {
    if (!this.currentTile || !this.formElements) {
      console.warn('Cannot update form: missing currentTile or formElements');
      return;
    }

    const { type, content, position, styles = {}, name = '' } = this.currentTile;
    
    // Basic properties
    this.safeSetValue(this.formElements.type, type, TILE_TYPES.TEXT);
    this.safeSetValue(this.formElements.content, content);
    this.safeSetValue(this.formElements.name, name);
    
    // Position
    if (position) {
      this.safeSetValue(this.formElements.x, position.x, 0);
      this.safeSetValue(this.formElements.y, position.y, 0);
      this.safeSetValue(this.formElements.width, position.width, 200);
      this.safeSetValue(this.formElements.height, position.height, 150);
    }

    // Styles
    const bgColor = styles.backgroundColor || '#ffffff';
    const textColor = styles.color || '#000000';
    const borderRadius = parseInt(styles.borderRadius || '0', 10);
    const opacity = parseFloat(styles.opacity || '1');

    this.safeSetValue(this.formElements.backgroundColor, bgColor);
    this.safeSetValue(this.formElements.backgroundColorText, bgColor);
    this.safeSetValue(this.formElements.color, textColor);
    this.safeSetValue(this.formElements.colorText, textColor);
    
    if (this.formElements.borderRadius) {
      this.formElements.borderRadius.value = borderRadius;
      const borderRadiusDisplay = this.formElements.borderRadius.nextElementSibling;
      if (borderRadiusDisplay) {
        borderRadiusDisplay.textContent = `${borderRadius}px`;
      }
    }
    
    if (this.formElements.opacity) {
      this.formElements.opacity.value = opacity;
      const opacityDisplay = this.formElements.opacity.nextElementSibling;
      if (opacityDisplay) {
        opacityDisplay.textContent = `${Math.round(opacity * 100)}%`;
      }
    }
  }
}
