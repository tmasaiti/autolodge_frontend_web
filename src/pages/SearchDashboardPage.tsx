import React, { useState } from 'react';
import { SearchInterface } from '../components/search/SearchInterface';
import { SavedSearchesManager } from '../components/search/SavedSearchesManager';
import { SearchAlertsManager } from '../components/search/SearchAlertsManager';
import { SearchAnalytics } from '../components/search/SearchAnalytics';
import { SearchParams } from '../store/slices/searchSlice';
import { Button } from '../components/ui/Button';
import { 
  Search, 
  Bookmark, 
  Bell, 
  BarChart3,
  Grid,
  List
} from 'lucide-react';

type DashboardView = 'search' | 'saved' | 'alerts' | 'analytics';

export function SearchDashboardPage() {
  const [activeView, setActiveView] = useState<DashboardView>('search');
  const [currentSearch, setCurrentSearch] = useState<SearchParams | null>(null);

  const handleSearchLoad = (search: SearchParams) => {
    setCurrentSearch(search);
    setActiveView('search');
  };

  const navigationItems = [
    {
      id: 'search' as DashboardView,
      label: 'Search Vehicles',
      icon: Search,
      description: 'Find and book vehicles'
    },
    {
      id: 'saved' as DashboardView,
      label: 'Saved Searches',
      icon: Bookmark,
      description: 'Manage your saved searches'
    },
    {
      id: 'alerts' as DashboardView,
      label: 'Search Alerts',
      icon: Bell,
      description: 'Configure search notifications'
    },
    {
      id: 'analytics' as DashboardView,
      label: 'Analytics',
      icon: BarChart3,
      description: 'View search insights'
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'search':
        return (
          <SearchInterface 
            className="bg-white rounded-lg shadow-sm"
          />
        );
      case 'saved':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SavedSearchesManager 
              currentSearch={currentSearch}
              onSearchLoad={handleSearchLoad}
            />
          </div>
        );
      case 'alerts':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SearchAlertsManager />
          </div>
        );
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SearchAnalytics />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Search</h1>
              <p className="text-gray-600">Find the perfect vehicle for your journey</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {navigationItems.map(item => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeView === item.id ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView(item.id)}
                    className="flex items-center"
                    title={item.description}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveView()}
      </div>

      {/* Quick Actions Sidebar (for saved searches and alerts) */}
      {(activeView === 'saved' || activeView === 'alerts') && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {activeView === 'saved' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView('search')}
                  className="w-full justify-start"
                >
                  <Search className="w-4 h-4 mr-2" />
                  New Search
                </Button>
              )}
              {activeView === 'alerts' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('saved')}
                    className="w-full justify-start"
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Saved Searches
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('analytics')}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}