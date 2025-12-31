import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { searchSlice, SearchParams } from '../../store/slices/searchSlice';
import { savedSearchService } from '../../services/savedSearchService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Bookmark, 
  Bell, 
  BellOff, 
  Edit2, 
  Trash2, 
  Search, 
  Calendar,
  MapPin,
  Plus,
  X
} from 'lucide-react';

interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  query: SearchParams;
  alerts_enabled: boolean;
  last_run: string;
  created_at: string;
  updated_at: string;
}

interface SavedSearchesManagerProps {
  className?: string;
  currentSearch?: SearchParams | null;
  onSearchLoad?: (search: SearchParams) => void;
}

export const SavedSearchesManager: React.FC<SavedSearchesManagerProps> = ({
  className = "",
  currentSearch,
  onSearchLoad
}) => {
  const dispatch = useDispatch();
  const { savedSearches, loading } = useSelector((state: RootState) => state.search);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [searchName, setSearchName] = useState('');
  const [enableAlerts, setEnableAlerts] = useState(true);

  // Load saved searches on component mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = useCallback(async () => {
    try {
      dispatch(searchSlice.actions.setLoading(true));
      const searches = await savedSearchService.getSavedSearches();
      dispatch(searchSlice.actions.setSavedSearches(searches));
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      dispatch(searchSlice.actions.setLoading(false));
    }
  }, [dispatch]);

  const handleSaveCurrentSearch = useCallback(() => {
    if (!currentSearch) return;
    setSearchName('');
    setEnableAlerts(true);
    setShowSaveModal(true);
  }, [currentSearch]);

  const handleSaveSearch = useCallback(async () => {
    if (!currentSearch || !searchName.trim()) return;

    try {
      const savedSearch = await savedSearchService.createSavedSearch({
        name: searchName.trim(),
        query: currentSearch,
        alerts_enabled: enableAlerts
      });
      
      dispatch(searchSlice.actions.addSavedSearch(savedSearch));
      setShowSaveModal(false);
      setSearchName('');
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [currentSearch, searchName, enableAlerts, dispatch]);

  const handleEditSearch = useCallback((search: SavedSearch) => {
    setEditingSearch(search);
    setSearchName(search.name);
    setEnableAlerts(search.alerts_enabled);
    setShowEditModal(true);
  }, []);

  const handleUpdateSearch = useCallback(async () => {
    if (!editingSearch || !searchName.trim()) return;

    try {
      const updatedSearch = await savedSearchService.updateSavedSearch(editingSearch.id, {
        name: searchName.trim(),
        alerts_enabled: enableAlerts
      });
      
      const updatedSearches = savedSearches.map(s => 
        s.id === editingSearch.id ? updatedSearch : s
      );
      dispatch(searchSlice.actions.setSavedSearches(updatedSearches));
      
      setShowEditModal(false);
      setEditingSearch(null);
      setSearchName('');
    } catch (error) {
      console.error('Failed to update search:', error);
    }
  }, [editingSearch, searchName, enableAlerts, savedSearches, dispatch]);

  const handleDeleteSearch = useCallback(async (searchId: number) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;

    try {
      await savedSearchService.deleteSavedSearch(searchId);
      const updatedSearches = savedSearches.filter(s => s.id !== searchId);
      dispatch(searchSlice.actions.setSavedSearches(updatedSearches));
    } catch (error) {
      console.error('Failed to delete search:', error);
    }
  }, [savedSearches, dispatch]);

  const handleToggleAlerts = useCallback(async (search: SavedSearch) => {
    try {
      const updatedSearch = await savedSearchService.updateSavedSearch(search.id, {
        alerts_enabled: !search.alerts_enabled
      });
      
      const updatedSearches = savedSearches.map(s => 
        s.id === search.id ? updatedSearch : s
      );
      dispatch(searchSlice.actions.setSavedSearches(updatedSearches));
    } catch (error) {
      console.error('Failed to toggle alerts:', error);
    }
  }, [savedSearches, dispatch]);

  const handleLoadSearch = useCallback((search: SavedSearch) => {
    if (onSearchLoad) {
      onSearchLoad(search.query);
    }
  }, [onSearchLoad]);

  const formatSearchSummary = (query: SearchParams) => {
    const parts = [];
    
    if (query.location) {
      parts.push(`📍 ${query.location.city}`);
    }
    
    if (query.date_range.start_date && query.date_range.end_date) {
      const startDate = new Date(query.date_range.start_date).toLocaleDateString();
      const endDate = new Date(query.date_range.end_date).toLocaleDateString();
      parts.push(`📅 ${startDate} - ${endDate}`);
    }
    
    if (query.filters.vehicle_category) {
      parts.push(`🚗 ${query.filters.vehicle_category}`);
    }
    
    if (query.filters.price_range) {
      const { min, max, currency } = query.filters.price_range;
      parts.push(`💰 ${currency} ${min || 0} - ${max || '∞'}`);
    }
    
    return parts.join(' • ');
  };

  return (
    <div className={`saved-searches-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bookmark className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Saved Searches</h3>
          {savedSearches.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {savedSearches.length}
            </Badge>
          )}
        </div>
        
        {currentSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCurrentSearch}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Save Current Search
          </Button>
        )}
      </div>

      {/* Saved Searches List */}
      {savedSearches.length === 0 ? (
        <Card className="p-8 text-center">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No saved searches yet</h4>
          <p className="text-gray-500 mb-4">
            Save your searches to quickly access them later and get alerts for new matches.
          </p>
          {currentSearch && (
            <Button onClick={handleSaveCurrentSearch}>
              Save Current Search
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {savedSearches.map(search => (
            <Card key={search.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium text-gray-900 mr-2">{search.name}</h4>
                    {search.alerts_enabled && (
                      <Badge variant="primary" size="sm" className="flex items-center">
                        <Bell className="w-3 h-3 mr-1" />
                        Alerts On
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {formatSearchSummary(search.query)}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <span>Created: {new Date(search.created_at).toLocaleDateString()}</span>
                    {search.last_run && (
                      <span className="ml-4">
                        Last run: {new Date(search.last_run).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoadSearch(search)}
                    title="Load this search"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAlerts(search)}
                    title={search.alerts_enabled ? "Disable alerts" : "Enable alerts"}
                  >
                    {search.alerts_enabled ? (
                      <BellOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSearch(search)}
                    title="Edit search"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSearch(search.id)}
                    title="Delete search"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Save Search Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)}>
        <Modal.Header>
          <h3 className="text-lg font-semibold">Save Search</h3>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Name
              </label>
              <Input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Weekend trip to Cape Town"
                className="w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable-alerts"
                checked={enableAlerts}
                onChange={(e) => setEnableAlerts(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="enable-alerts" className="text-sm text-gray-700">
                Enable email alerts for new matches
              </label>
            </div>
            
            {currentSearch && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Search details:</p>
                <p className="text-sm font-medium">{formatSearchSummary(currentSearch)}</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowSaveModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSearch}
            disabled={!searchName.trim()}
          >
            Save Search
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Search Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <Modal.Header>
          <h3 className="text-lg font-semibold">Edit Search</h3>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Name
              </label>
              <Input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter search name"
                className="w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-enable-alerts"
                checked={enableAlerts}
                onChange={(e) => setEnableAlerts(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="edit-enable-alerts" className="text-sm text-gray-700">
                Enable email alerts for new matches
              </label>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateSearch}
            disabled={!searchName.trim()}
          >
            Update Search
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};