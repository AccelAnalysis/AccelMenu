import { createClient } from '@supabase/supabase-js';
import { appState } from './state.js';

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Check if we need to migrate from localStorage
    await this.migrateFromLocalStorage();
    this.initialized = true;
  }

  async migrateFromLocalStorage() {
    // Implementation for migrating from localStorage
  }

  // Location methods
  async fetchLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
    return data;
  }

  async saveLocation(location) {
    const { data, error } = await supabase
      .from('locations')
      .upsert({
        id: location.id,
        name: location.name,
        data: location,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error saving location:', error);
      throw error;
    }
    return data[0];
  }

  // Board methods
  async fetchBoards(locationId) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('location_id', locationId)
      .order('name');
    
    if (error) {
      console.error('Error fetching boards:', error);
      throw error;
    }
    return data;
  }

  async saveBoard(locationId, board) {
    const { data, error } = await supabase
      .from('boards')
      .upsert({
        id: board.id,
        location_id: locationId,
        name: board.name,
        data: board,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error saving board:', error);
      throw error;
    }
    return data[0];
  }

  // Slide methods
  async fetchSlides(boardId) {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching slides:', error);
      throw error;
    }
    return data;
  }

  async saveSlide(boardId, slide) {
    const { data, error } = await supabase
      .from('slides')
      .upsert({
        id: slide.id,
        board_id: boardId,
        name: slide.name,
        data: slide,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error saving slide:', error);
      throw error;
    }
    return data[0];
  }

  // Real-time subscriptions
  subscribeToChanges(callback) {
    const subscription = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: '*' }, payload => {
        callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}

export const databaseService = new DatabaseService();