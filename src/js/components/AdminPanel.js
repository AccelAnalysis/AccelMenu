import { TILE_TYPES } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';
import { appState } from '../services/state.js';

export class AdminPanel {
  /**
   * Create a new AdminPanel instance
   * @param {HTMLElement} container - The container element where the admin panel will be rendered
   * @param {Function} onAddTile - Callback function when a new tile is added
   * @param {Function} onUpdateTile - Callback function when a tile is updated
   * @param {Function} onRemoveTile - Callback function when a tile is removed
   */
  constructor(container, onAddTile, onUpdateTile, onRemoveTile) {
    this.container = container;
    this.onAddTile = onAddTile;
    this.onUpdateTile = onUpdateTile;
    this.onRemoveTile = onRemoveTile;
    this.selectedTileId = null;
    this.initialize();
  }

  /**
   * Initialize the admin panel
   */
  initialize() {
    this.createUI();
    this.setupEventListeners();
  }

  /**
   * Create the admin panel UI
   */
  createUI() {
    this.container.innerHTML = `
      <div class="admin-panel">
        <div class="admin-header">
          <h3>Tile Manager</h3>
          <button id="add-tile-btn" class="btn btn-primary">+ Add Tile</button>
        </div>
        <div class="tile-list" id="tile-list">
          <!-- Tiles will be listed here -->
        </div>
        <div class="tile-editor" id="tile-editor">
          <div class="editor-header">Tile Properties</div>
          <div class="editor-body" id="tile-properties">
            <p>Select a tile to edit its properties</p>
          </div>
        </div>
      </div>
    `;

    this.tileList = this.container.querySelector('#tile-list');
    this.tileProperties = this.container.querySelector('#tile-properties');
  }

  /**
   * Set up event listeners for the admin panel
   */
  setupEventListeners() {
    this.container.querySelector('#add-tile-btn').addEventListener('click', () => {
      this.showAddTileForm();
    });
  }

  /**
   * Show the form to add a new tile
   */
  showAddTileForm() {
    const form = document.createElement('form');
    form.className = 'tile-form';
    form.innerHTML = `
      <h4>Add New Tile</h4>
      <div class="form-group">
        <label>Type</label>
        <select name="type" required>
          ${Object.entries(TILE_TYPES).map(([key, value]) => 
            `<option value="${value}">${key}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Width</label>
        <input type="number" name="width" value="200" min="50" required>
      </div>
      <div class="form-group">
        <label>Height</label>
        <input type="number" name="height" value="150" min="50" required>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Tile</button>
      </div>
    `;

    form.querySelector('.cancel-btn').addEventListener('click', () => {
      this.tileProperties.innerHTML = '<p>Select a tile to edit its properties</p>';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const newTile = {
        id: generateId(),
        type: formData.get('type'),
        position: {
          x: 50,
          y: 50,
          width: parseInt(formData.get('width')),
          height: parseInt(formData.get('height'))
        },
        content: '',
        styles: {}
      };
      this.onAddTile(newTile);
      this.tileProperties.innerHTML = '<p>Select a tile to edit its properties</p>';
    });

    this.tileProperties.innerHTML = '';
    this.tileProperties.appendChild(form);
  }

  /**
   * Show the properties form for a specific tile
   * @param {Object} tile - The tile to edit
   */
  showTileProperties(tile) {
    const form = document.createElement('form');
    form.className = 'tile-form';
    form.innerHTML = `
      <h4>Edit Tile</h4>
      <div class="form-group">
        <label>Type</label>
        <select name="type" disabled>
          <option>${tile.type}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Position X</label>
        <input type="number" name="x" value="${tile.position.x}" required>
      </div>
      <div class="form-group">
        <label>Position Y</label>
        <input type="number" name="y" value="${tile.position.y}" required>
      </div>
      <div class="form-group">
        <label>Width</label>
        <input type="number" name="width" value="${tile.position.width}" min="50" required>
      </div>
      <div class="form-group">
        <label>Height</label>
        <input type="number" name="height" value="${tile.position.height}" min="50" required>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-danger remove-btn">Remove Tile</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    `;

    form.querySelector('.remove-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to remove this tile?')) {
        this.onRemoveTile(tile.id);
        this.tileProperties.innerHTML = '<p>Select a tile to edit its properties</p>';
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updates = {
        position: {
          x: parseInt(formData.get('x')),
          y: parseInt(formData.get('y')),
          width: parseInt(formData.get('width')),
          height: parseInt(formData.get('height'))
        }
      };
      this.onUpdateTile(tile.id, updates);
    });

    this.tileProperties.innerHTML = '';
    this.tileProperties.appendChild(form);
  }

  /**
   * Update the tile list in the UI
   * @param {Array} tiles - Array of tile objects
   */
  updateTileList(tiles) {
    this.tileList.innerHTML = '';
    
    if (tiles.length === 0) {
      this.tileList.innerHTML = '<p class="no-tiles">No tiles added yet</p>';
      return;
    }

    tiles.forEach((tile) => {
      const tileElement = document.createElement('div');
      tileElement.className = `tile-item ${this.selectedTileId === tile.id ? 'selected' : ''}`;
      tileElement.innerHTML = `
        <div class="tile-preview" style="background-color: #f0f0f0; width: 30px; height: 20px;"></div>
        <div class="tile-info">
          <div class="tile-type">${tile.type} Tile</div>
          <div class="tile-dimensions">${tile.position.width} × ${tile.position.height}</div>
        </div>
      `;
      
      tileElement.addEventListener('click', () => {
        this.selectedTileId = tile.id;
        this.showTileProperties(tile);
        // Highlight selected tile in the UI
        document.querySelectorAll('.tile-item').forEach(el => el.classList.remove('selected'));
        tileElement.classList.add('selected');
      });

      this.tileList.appendChild(tileElement);
    });
  }
}