import { api } from './api';
import { SearchParams } from '../store/slices/searchSlice';

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  query: SearchParams;
  alerts_enabled: boolean;
  last_run: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedSearchRequest {
  name: string;
  query: SearchParams;
  alerts_enabled: boolean;
}

export interface UpdateSavedSearchRequest {
  name?: string;
  alerts_enabled?: boolean;
}

export const savedSearchService = {
  // Get all saved searches for the current user
  getSavedSearches: async (): Promise<SavedSearch[]> => {
    const response = await api.get<SavedSearch[]>('/saved-searches');
    return response.data;
  },

  // Create a new saved search
  createSavedSearch: async (data: CreateSavedSearchRequest): Promise<SavedSearch> => {
    const response = await api.post<SavedSearch>('/saved-searches', data);
    return response.data;
  },

  // Update an existing saved search
  updateSavedSearch: async (id: number, data: UpdateSavedSearchRequest): Promise<SavedSearch> => {
    const response = await api.put<SavedSearch>(`/saved-searches/${id}`, data);
    return response.data;
  },

  // Delete a saved search
  deleteSavedSearch: async (id: number): Promise<void> => {
    await api.delete(`/saved-searches/${id}`);
  },

  // Execute a saved search
  executeSavedSearch: async (id: number): Promise<{ results: any[], total: number, hasMore: boolean }> => {
    const response = await api.post<{ results: any[], total: number, hasMore: boolean }>(`/saved-searches/${id}/execute`);
    return response.data;
  },

  // Get saved search by ID
  getSavedSearch: async (id: number): Promise<SavedSearch> => {
    const response = await api.get<SavedSearch>(`/saved-searches/${id}`);
    return response.data;
  },

  // Duplicate a saved search
  duplicateSavedSearch: async (id: number, newName: string): Promise<SavedSearch> => {
    const response = await api.post<SavedSearch>(`/saved-searches/${id}/duplicate`, { name: newName });
    return response.data;
  },

  // Get search history for analytics
  getSearchHistory: async (limit = 50): Promise<Array<{
    id: number;
    query: SearchParams;
    results_count: number;
    executed_at: string;
  }>> => {
    const response = await api.get(`/saved-searches/history?limit=${limit}`);
    return response.data;
  }
};